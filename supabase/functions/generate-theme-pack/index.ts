import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) throw new Error("Unauthorized");

    // Verify admin role
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) throw new Error("Admin access required");

    const { category, styleHints } = await req.json();
    if (!category) throw new Error("Category is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Step 1: Generate theme structure via tool calling
    const structurePrompt = `You are a world-class web designer. Generate a complete, premium e-commerce theme for the "${category}" category.
${styleHints ? `Style hints: ${styleHints}` : ""}

Create a visually stunning theme with:
- A harmonious color palette (6 colors: primary, secondary, accent, background, text, card)
- Font pairing from Google Fonts (heading + body)
- 5 pages with section layouts, each with animations

Section types available: hero, featured_products, category_grid, text_block, newsletter, banner_carousel, testimonials
Layout options: full-width, split-50-50, grid-2, grid-3, grid-4
Animation options: none, fade-in, slide-up, slide-in-left, scale-in, parallax

Make it look premium and professional. The theme should look like it costs ₹2999.`;

    const structureRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: structurePrompt }],
        tools: [{
          type: "function",
          function: {
            name: "create_theme_pack",
            description: "Create a complete multi-page theme pack",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string", description: "Theme name like 'Luxe Fashion' or 'Organic Bites'" },
                description: { type: "string", description: "Marketing copy for the theme (2-3 sentences)" },
                theme_config: {
                  type: "object",
                  properties: {
                    colors: {
                      type: "object",
                      properties: {
                        primary: { type: "string" },
                        secondary: { type: "string" },
                        accent: { type: "string" },
                        background: { type: "string" },
                        text: { type: "string" },
                        card: { type: "string" },
                      },
                      required: ["primary", "secondary", "accent", "background", "text", "card"],
                    },
                    fonts: {
                      type: "object",
                      properties: {
                        heading: { type: "string" },
                        body: { type: "string" },
                      },
                      required: ["heading", "body"],
                    },
                    borderRadius: { type: "number" },
                  },
                  required: ["colors", "fonts", "borderRadius"],
                },
                pages: {
                  type: "object",
                  properties: {
                    home: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          type: { type: "string" },
                          layout: { type: "string" },
                          animation: { type: "string" },
                          title: { type: "string" },
                          subtitle: { type: "string" },
                          height: { type: "string" },
                          cardStyle: { type: "string" },
                          margins: {
                            type: "object",
                            properties: { top: { type: "number" }, bottom: { type: "number" } },
                          },
                          padding: {
                            type: "object",
                            properties: { x: { type: "number" }, y: { type: "number" } },
                          },
                        },
                        required: ["type", "layout", "animation", "title"],
                      },
                    },
                    about: { type: "array", items: { type: "object" } },
                    blog: { type: "array", items: { type: "object" } },
                    contact: { type: "array", items: { type: "object" } },
                    shop: { type: "array", items: { type: "object" } },
                  },
                  required: ["home"],
                },
                image_prompts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      section: { type: "string", description: "Which section this image is for (e.g. 'home_hero')" },
                      prompt: { type: "string", description: "Detailed image generation prompt" },
                    },
                    required: ["section", "prompt"],
                  },
                  description: "4-6 image prompts for AI image generation",
                },
              },
              required: ["name", "description", "theme_config", "pages", "image_prompts"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_theme_pack" } },
      }),
    });

    if (!structureRes.ok) {
      const errText = await structureRes.text();
      console.error("AI structure error:", structureRes.status, errText);
      if (structureRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (structureRes.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Add funds in Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI generation failed");
    }

    const structureData = await structureRes.json();
    const toolCall = structureData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return structured data");

    const themeData = JSON.parse(toolCall.function.arguments);
    const structureTokens = structureData.usage?.total_tokens || 3000;

    // Step 2: Generate images
    const imagePrompts = themeData.image_prompts || [];
    const generatedImages: Record<string, string> = {};
    let imageTokens = 0;

    for (const imgReq of imagePrompts.slice(0, 5)) {
      try {
        const imgRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-image-preview",
            messages: [{ role: "user", content: imgReq.prompt + ". High quality, professional e-commerce photography style, 16:9 aspect ratio." }],
            modalities: ["image", "text"],
          }),
        });

        if (imgRes.ok) {
          const imgData = await imgRes.json();
          const base64 = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          if (base64) {
            // Upload to storage
            const imageBytes = Uint8Array.from(atob(base64.split(",")[1] || base64), c => c.charCodeAt(0));
            const path = `themes/${crypto.randomUUID()}.png`;
            const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
            const adminClient = createClient(supabaseUrl, serviceKey);
            const { error: uploadErr } = await adminClient.storage.from("product-images").upload(path, imageBytes, { contentType: "image/png" });
            if (!uploadErr) {
              const { data: { publicUrl } } = adminClient.storage.from("product-images").getPublicUrl(path);
              generatedImages[imgReq.section] = publicUrl;
            }
          }
          imageTokens += imgData.usage?.total_tokens || 1000;
        }
      } catch (e) {
        console.error("Image gen error:", e);
      }
    }

    // Assign images to sections
    const pages = themeData.pages;
    if (pages.home) {
      for (const section of pages.home) {
        const key = `home_${section.type}`;
        if (generatedImages[key]) {
          section.image = generatedImages[key];
        }
      }
    }

    // Calculate cost (approximate)
    // Gemini Flash: ~$0.15/1M input, ~$0.60/1M output ≈ roughly ₹0.05 per 1K tokens
    // Image gen: ~$0.04 per image ≈ ₹3.5 per image
    const textCost = (structureTokens / 1000) * 0.05;
    const imageCost = Object.keys(generatedImages).length * 3.5;
    const totalCostInr = Math.round((textCost + imageCost) * 100) / 100;

    // Use thumbnail from hero image if available
    const thumbnail = generatedImages["home_hero"] || Object.values(generatedImages)[0] || null;

    // Save to database using service role
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: pack, error: insertErr } = await adminClient.from("theme_packs").insert({
      name: themeData.name,
      category,
      description: themeData.description,
      thumbnail,
      pages,
      theme_config: themeData.theme_config,
      price: 499,
      ai_generation_cost: totalCostInr,
      is_published: false,
      created_by: user.id,
    }).select().single();

    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({
      success: true,
      theme_pack: pack,
      images_generated: Object.keys(generatedImages).length,
      cost: totalCostInr,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-theme-pack error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
