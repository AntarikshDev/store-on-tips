import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const NewClientStore = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const partnerQ = useQuery({
    enabled: !!user,
    queryKey: ["my-partner", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("partners").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
  });

  const summaryQ = useQuery({
    enabled: !!partnerQ.data?.id,
    queryKey: ["partner-license-summary", partnerQ.data?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("partner_license_summary", { _partner_id: partnerQ.data!.id });
      return Array.isArray(data) ? data[0] : data;
    },
  });

  if (loading || partnerQ.isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!partnerQ.data) return <Navigate to="/partner" replace />;

  const available = summaryQ.data?.available ?? 0;

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Store name required"); return; }
    if (available <= 0) { toast.error("No available licenses"); return; }
    setSubmitting(true);
    try {
      const finalSlug = (slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")) + "-" + Math.random().toString(36).slice(2, 6);

      const { data: store, error } = await supabase
        .from("stores")
        .insert({
          user_id: user.id,
          owned_by_partner_id: partnerQ.data.id,
          name: name.trim(),
          slug: finalSlug,
          onboarding_step: 0,
          theme: { theme_id: 'minimal-light', name: 'minimal-light', primary_color: '#F97316' },
        })
        .select()
        .single();
      if (error) throw error;

      const { error: rpcErr } = await supabase.rpc("consume_partner_license", {
        _partner_id: partnerQ.data.id,
        _store_id: store.id,
      });
      if (rpcErr) {
        // rollback by deleting the store
        await supabase.from("stores").delete().eq("id", store.id);
        throw rpcErr;
      }

      toast.success("License consumed. Build your client's store!");
      navigate("/onboarding");
    } catch (e: any) {
      toast.error(e.message || "Failed to create store");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/40 to-amber-50/40 p-6">
      <div className="max-w-xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate("/partner")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to partner dashboard
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Create a new client store</CardTitle>
            <CardDescription>
              This will spend 1 license ({available} available). You'll be taken through the standard store setup wizard on behalf of your client.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Store name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sharma General Store" />
            </div>
            <div>
              <Label>Store URL slug (optional)</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="sharma-store" />
              <p className="text-xs text-muted-foreground mt-1">A random suffix is added for uniqueness.</p>
            </div>
            <Button onClick={handleCreate} disabled={submitting || available <= 0} className="w-full bg-orange-600 hover:bg-orange-700">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : `Consume 1 license & start building`}
            </Button>
            {available <= 0 && <p className="text-sm text-red-600">You have no available licenses. Ask the admin to allocate more.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewClientStore;
