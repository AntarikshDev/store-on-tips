const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a blog image (cover 16:9 or thumbnail 1:1) using Gemini Nano Banana 2 (fast, pro-quality)
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { title, body, store_name, category, kind } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('Missing API key');

    const isThumb = kind === 'thumbnail';
    const aspectHint = isThumb
      ? 'Square 1:1 composition, subject perfectly centered, balanced negative space on all sides — must work as a small thumbnail.'
      : 'Wide cinematic 16:9 composition, hero-banner style with strong focal point on the right or left third. Leave breathing room for an overlay headline. Do NOT add any text, logos, watermarks, captions, or letters in the image.';

    const excerpt = (body || '').replace(/[#*_`>\-]/g, ' ').slice(0, 600);

    const visualPrompt = `Editorial, high-end, photorealistic ${isThumb ? 'square thumbnail' : 'magazine cover image'} for a blog post.

Blog title: "${title}"
Store: ${store_name || 'an online store'} (category: ${category || 'general'})
Article context: ${excerpt}

Style: premium e-commerce editorial photography, natural daylight, shallow depth of field, rich realistic colors, lifestyle composition relevant to the topic and category. Tasteful, brand-safe, no people staring at camera unless natural.

${aspectHint}

Absolutely no text, no captions, no typography, no watermark, no logo of any kind in the image. Pure imagery only.`;

    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Nano Banana 2 — fast + pro-quality image generation
        model: 'google/gemini-3.1-flash-image-preview',
        messages: [{ role: 'user', content: visualPrompt }],
        modalities: ['image', 'text'],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 429) throw new Error('Rate limited. Please try again in a moment.');
      if (res.status === 402) throw new Error('AI credits exhausted. Add credits in workspace settings.');
      throw new Error(`Image API error: ${res.status} ${errText}`);
    }

    const data = await res.json();
    const imageUrl = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) throw new Error('No image returned from model');

    return new Response(JSON.stringify({ image: imageUrl, kind }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
