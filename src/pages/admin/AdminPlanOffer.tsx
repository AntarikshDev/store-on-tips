import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface PlanOfferRow {
  id?: string;
  enabled: boolean;
  percent_off: number;
  starts_at: string | null;
  ends_at: string | null;
  label: string | null;
  banner_text: string | null;
  banner_bg_color: string | null;
  banner_text_color: string | null;
  show_banner: boolean;
  applies_to_monthly: boolean;
  applies_to_annual: boolean;
}

const DEFAULTS: PlanOfferRow = {
  enabled: false,
  percent_off: 20,
  starts_at: null,
  ends_at: null,
  label: 'Festive Offer',
  banner_text: '',
  banner_bg_color: '#F97316',
  banner_text_color: '#FFFFFF',
  show_banner: true,
  applies_to_monthly: true,
  applies_to_annual: true,
};

const toLocalInput = (iso: string | null) =>
  iso ? new Date(iso).toISOString().slice(0, 16) : '';
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

const AdminPlanOffer = () => {
  const [form, setForm] = useState<PlanOfferRow>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('platform_plan_offers' as any)
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setForm({ ...DEFAULTS, ...(data as any) });
      setLoading(false);
    })();
  }, []);

  const set = <K extends keyof PlanOfferRow>(k: K, v: PlanOfferRow[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    const payload = {
      enabled: form.enabled,
      percent_off: Math.min(90, Math.max(0, Number(form.percent_off) || 0)),
      starts_at: form.starts_at,
      ends_at: form.ends_at,
      label: form.label,
      banner_text: form.banner_text,
      banner_bg_color: form.banner_bg_color,
      banner_text_color: form.banner_text_color,
      show_banner: form.show_banner,
      applies_to_monthly: form.applies_to_monthly,
      applies_to_annual: form.applies_to_annual,
    };
    const q = form.id
      ? supabase.from('platform_plan_offers' as any).update(payload).eq('id', form.id)
      : supabase.from('platform_plan_offers' as any).insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success('Plan offer saved');
      const { data } = await supabase
        .from('platform_plan_offers' as any)
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) setForm({ ...DEFAULTS, ...(data as any) });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> Platform Plan Offer
        </h1>
        <p className="text-sm text-muted-foreground">
          A single % discount that applies to all subscription plans for merchants
          (monthly &amp; annual). Use this for festive promotions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            Offer
            <Switch
              checked={form.enabled}
              onCheckedChange={(v) => set('enabled', v)}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Discount %</Label>
              <Input
                type="number"
                min={0}
                max={90}
                value={form.percent_off}
                onChange={(e) => set('percent_off', Number(e.target.value || 0))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Label</Label>
              <Input
                value={form.label || ''}
                onChange={(e) => set('label', e.target.value)}
                placeholder="Diwali Offer"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Show banner on Billing</Label>
              <div className="flex items-center h-10">
                <Switch
                  checked={form.show_banner}
                  onCheckedChange={(v) => set('show_banner', v)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Starts at</Label>
              <Input
                type="datetime-local"
                value={toLocalInput(form.starts_at)}
                onChange={(e) => set('starts_at', fromLocalInput(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ends at</Label>
              <Input
                type="datetime-local"
                value={toLocalInput(form.ends_at)}
                onChange={(e) => set('ends_at', fromLocalInput(e.target.value))}
              />
            </div>
            <div className="space-y-1 md:col-span-3">
              <Label className="text-xs">Banner text</Label>
              <Input
                value={form.banner_text || ''}
                onChange={(e) => set('banner_text', e.target.value)}
                placeholder="🎉 Diwali Sale — Flat 20% off all plans"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Banner background</Label>
              <Input
                type="color"
                value={form.banner_bg_color || '#F97316'}
                onChange={(e) => set('banner_bg_color', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Banner text color</Label>
              <Input
                type="color"
                value={form.banner_text_color || '#FFFFFF'}
                onChange={(e) => set('banner_text_color', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t">
            <label className="flex items-center justify-between rounded-md border p-2 text-sm">
              <span>Apply to Monthly plans</span>
              <Switch
                checked={form.applies_to_monthly}
                onCheckedChange={(v) => set('applies_to_monthly', v)}
              />
            </label>
            <label className="flex items-center justify-between rounded-md border p-2 text-sm">
              <span>Apply to Annual plans</span>
              <Switch
                checked={form.applies_to_annual}
                onCheckedChange={(v) => set('applies_to_annual', v)}
              />
            </label>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Note: Annual plan payments will be charged at the discounted amount
            automatically. Monthly subscriptions use fixed Razorpay plan IDs — the
            discount is shown to users but Razorpay's recurring price is unchanged.
            Adjust monthly plan prices in <strong>Plans</strong> if you need a real
            charge change.
          </p>

          <Button onClick={save} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save offer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPlanOffer;
