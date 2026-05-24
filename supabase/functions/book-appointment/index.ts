// Public storefront booking endpoint. Creates an appointment row and returns
// id + appointment_number. Recomputes the price server-side so customers
// can't tamper with totals.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  store_id: string;
  service_id: string;
  provider_id: string;
  slot_start: string; // ISO
  mode: "in_store" | "home_visit" | "teleconsult";
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_user_id?: string;
  address?: { line1: string; pincode: string; city?: string; state?: string } | null;
  special_request?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    const required = ["store_id", "service_id", "provider_id", "slot_start", "customer_name", "customer_phone"];
    for (const k of required) {
      if (!(body as any)[k]) {
        return new Response(JSON.stringify({ error: `Missing ${k}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: svc } = await supabase
      .from("services")
      .select("name, duration_min, price, gst_pct, home_visit_addon, is_active, store_id")
      .eq("id", body.service_id)
      .maybeSingle();
    if (!svc || svc.store_id !== body.store_id || !svc.is_active) {
      return new Response(JSON.stringify({ error: "Service unavailable" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: prov } = await supabase
      .from("service_providers")
      .select("id, accepts_home_visit, accepts_teleconsult, is_active, store_id")
      .eq("id", body.provider_id)
      .maybeSingle();
    if (!prov || prov.store_id !== body.store_id || !prov.is_active) {
      return new Response(JSON.stringify({ error: "Provider unavailable" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.mode === "home_visit" && !prov.accepts_home_visit) {
      return new Response(JSON.stringify({ error: "Home visit not available" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (body.mode === "teleconsult" && !prov.accepts_teleconsult) {
      return new Response(JSON.stringify({ error: "Teleconsult not available" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const start = new Date(body.slot_start);
    const end = new Date(start.getTime() + (svc.duration_min ?? 30) * 60_000);

    // Conflict check
    const { data: conflict } = await supabase
      .from("appointments")
      .select("id")
      .eq("provider_id", body.provider_id)
      .gte("slot_start", new Date(start.getTime() - 60_000).toISOString())
      .lt("slot_start", new Date(start.getTime() + 60_000).toISOString())
      .not("status", "in", "(cancelled,no_show)")
      .limit(1);
    if (conflict && conflict.length > 0) {
      return new Response(JSON.stringify({ error: "Slot just taken — please pick another" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const travelFee = body.mode === "home_visit" ? Number(svc.home_visit_addon ?? 0) : 0;
    const base = Number(svc.price ?? 0);
    const gst = Number(((base + travelFee) * Number(svc.gst_pct ?? 0)) / 100);
    const total = Number(base + travelFee + gst);

    const apptNumber = `APT-${Date.now().toString(36).toUpperCase()}`;

    const { data: appt, error } = await supabase
      .from("appointments")
      .insert({
        store_id: body.store_id,
        service_id: body.service_id,
        provider_id: body.provider_id,
        service_name_snapshot: svc.name,
        slot_start: start.toISOString(),
        slot_end: end.toISOString(),
        mode: body.mode,
        status: "pending",
        appointment_number: apptNumber,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        customer_email: body.customer_email ?? null,
        customer_user_id: body.customer_user_id ?? null,
        address: body.address ?? null,
        special_request: body.special_request ?? null,
        price: base,
        travel_fee: travelFee,
        gst,
        total,
        payment_status: "unpaid",
      })
      .select("id, appointment_number")
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, appointment: appt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
