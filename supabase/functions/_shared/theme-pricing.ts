// Token→INR pricing for the theme pipeline. Mirrors theme-master-bazaar.
const PRICING: Record<string, { in: number; out: number }> = {
  "google/gemini-2.5-flash":      { in: 0.026, out: 0.105 },
  "google/gemini-2.5-flash-lite": { in: 0.0084, out: 0.0336 },
  "google/gemini-2.5-pro":        { in: 0.105, out: 0.84 },
  "google/gemini-3-flash-preview":{ in: 0.026, out: 0.105 },
  "google/gemini-3.1-pro-preview":{ in: 0.105, out: 0.84 },
  "openai/gpt-5":                 { in: 0.105, out: 0.84 },
  "openai/gpt-5-mini":            { in: 0.021, out: 0.168 },
  "openai/gpt-5-nano":            { in: 0.0042, out: 0.0336 },
  "google/gemini-3-pro-image-preview":   { in: 0, out: 0 },
  "google/gemini-3.1-flash-image-preview":{ in: 0, out: 0 },
};
export const IMAGE_COST_INR = 1.6;
export function costInr(model: string, promptTokens = 0, completionTokens = 0): number {
  const p = PRICING[model];
  if (!p) return 0;
  return Number(((promptTokens / 1000) * p.in + (completionTokens / 1000) * p.out).toFixed(4));
}
