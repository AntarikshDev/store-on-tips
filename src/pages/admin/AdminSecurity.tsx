import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Shield } from 'lucide-react';

const TIMEOUTS = [
  { v: 15, label: '15 minutes' },
  { v: 60, label: '1 hour' },
  { v: 480, label: '8 hours' },
  { v: 1440, label: '1 day' },
  { v: 10_080, label: '7 days' },
  { v: 43_200, label: '30 days' },
];

const AdminSecurity = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [timeout, setTimeoutVal] = useState(480);
  const [alertEmail, setAlertEmail] = useState('');
  const [autoHeal, setAutoHeal] = useState(true);
  const [thresholdMin, setThresholdMin] = useState(10);
  const [notifyMerchants, setNotifyMerchants] = useState(true);
  const [notifyCustomers, setNotifyCustomers] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('admin_settings').select('*').eq('id', 1).maybeSingle();
      if (data) {
        setTimeoutVal(data.session_timeout_minutes);
        setAlertEmail(data.alert_email ?? '');
        setAutoHeal(data.auto_heal_enabled);
        setThresholdMin(data.downtime_threshold_minutes);
        setNotifyMerchants(data.notify_merchants);
        setNotifyCustomers(data.notify_customers);
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('admin_settings').update({
      session_timeout_minutes: timeout,
      alert_email: alertEmail || null,
      auto_heal_enabled: autoHeal,
      downtime_threshold_minutes: thresholdMin,
      notify_merchants: notifyMerchants,
      notify_customers: notifyCustomers,
      updated_at: new Date().toISOString(),
    }).eq('id', 1);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    localStorage.setItem('admin_session_timeout_min', String(timeout));
    toast.success('Settings saved');
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div>;

  return (
    <div className="space-y-6 max-w-2xl pb-20 md:pb-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2"><Shield className="h-5 w-5" /> Security & Auto-Pilot</h1>
        <p className="text-sm text-muted-foreground">Session timeout and autonomous agent behavior</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Admin session</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Auto-logout after inactivity</Label>
            <Select value={String(timeout)} onValueChange={(v) => setTimeoutVal(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TIMEOUTS.map((t) => <SelectItem key={t.v} value={String(t.v)}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Sliding window — resets on every navigation.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Auto-Pilot agent</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Auto-heal enabled</p>
              <p className="text-xs text-muted-foreground">Agent re-provisions broken hostnames automatically</p>
            </div>
            <Switch checked={autoHeal} onCheckedChange={setAutoHeal} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Downtime alert threshold (minutes)</Label>
            <Input type="number" min={1} max={120} value={thresholdMin} onChange={(e) => setThresholdMin(Number(e.target.value))} className="max-w-[120px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Escalation email (you)</Label>
            <Input type="email" value={alertEmail} onChange={(e) => setAlertEmail(e.target.value)} placeholder="admin@pictocart.in" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Notify merchants on downtime</p>
              <p className="text-xs text-muted-foreground">Email merchant when their store is unreachable</p>
            </div>
            <Switch checked={notifyMerchants} onCheckedChange={setNotifyMerchants} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Notify recent customers</p>
              <p className="text-xs text-muted-foreground">Email customers with active orders if downtime &gt; threshold</p>
            </div>
            <Switch checked={notifyCustomers} onCheckedChange={setNotifyCustomers} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={save} disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save settings
      </Button>
    </div>
  );
};

export default AdminSecurity;
