import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Eye, IndianRupee } from 'lucide-react';

const AdminPartners = () => {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutUtr, setPayoutUtr] = useState('');

  const partnersQ = useQuery({
    queryKey: ['admin-partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const referralsQ = useQuery({
    enabled: !!selected,
    queryKey: ['admin-partner-refs', selected?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('partner_referrals')
        .select('*')
        .eq('partner_id', selected.id);
      return data ?? [];
    },
  });

  const payoutsQ = useQuery({
    enabled: !!selected,
    queryKey: ['admin-partner-payouts', selected?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('partner_payouts')
        .select('*')
        .eq('partner_id', selected.id)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const updateKyc = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('partners').update({ kyc_status: status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('KYC updated');
      qc.invalidateQueries({ queryKey: ['admin-partners'] });
    },
  });

  const recordPayout = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('partner_payouts').insert({
        partner_id: selected.id,
        amount: Number(payoutAmount),
        utr: payoutUtr || null,
        status: payoutUtr ? 'paid' : 'initiated',
        paid_at: payoutUtr ? new Date().toISOString() : null,
        period: new Date().toISOString().slice(0, 7),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Payout recorded');
      setPayoutAmount('');
      setPayoutUtr('');
      qc.invalidateQueries({ queryKey: ['admin-partner-payouts'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Partners</h1>
        <p className="text-muted-foreground">Freelancers and agencies referring sellers to the platform.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>All partners ({partnersQ.data?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          {partnersQ.isLoading ? (
            <div>Loading...</div>
          ) : partnersQ.data?.length ? (
            <div className="divide-y">
              {partnersQ.data.map((p) => (
                <div key={p.id} className="py-3 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.email} · code <code className="font-mono">{p.referral_code}</code> · {p.commission_pct}% × {p.commission_months}m
                    </div>
                  </div>
                  <Badge variant="outline">{p.type}</Badge>
                  <Select value={p.kyc_status} onValueChange={(v) => updateKyc.mutate({ id: p.id, status: v })}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" onClick={() => setSelected(p)}>
                    <Eye className="h-4 w-4 mr-1" /> Open
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No partners yet.</p>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Field label="Email" value={selected.email} />
                  <Field label="Phone" value={selected.phone ?? '—'} />
                  <Field label="UPI" value={selected.upi_id ?? '—'} />
                  <Field label="PAN" value={selected.pan ?? '—'} />
                  <Field label="Code" value={selected.referral_code} />
                  <Field label="Type" value={selected.type} />
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Referrals ({referralsQ.data?.length ?? 0})</h3>
                  <div className="divide-y border rounded">
                    {referralsQ.data?.map((r) => (
                      <div key={r.id} className="p-2 text-sm flex justify-between">
                        <span>Store {r.store_id?.slice(0, 8) ?? '—'}</span>
                        <Badge variant="outline">{r.status}</Badge>
                      </div>
                    )) ?? null}
                    {!referralsQ.data?.length && <div className="p-3 text-xs text-muted-foreground">No referrals.</div>}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Record payout</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Amount (₹)</Label>
                      <Input type="number" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">UTR (optional)</Label>
                      <Input value={payoutUtr} onChange={(e) => setPayoutUtr(e.target.value)} />
                    </div>
                  </div>
                  <Button
                    className="mt-2 w-full"
                    disabled={!payoutAmount || recordPayout.isPending}
                    onClick={() => recordPayout.mutate()}
                  >
                    <IndianRupee className="h-4 w-4 mr-1" />
                    {payoutUtr ? 'Mark Paid' : 'Initiate'}
                  </Button>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Payout history</h3>
                  <div className="divide-y border rounded">
                    {payoutsQ.data?.map((p) => (
                      <div key={p.id} className="p-2 text-sm flex justify-between">
                        <span>₹{Number(p.amount).toFixed(0)} · {p.period ?? '—'}</span>
                        <Badge variant={p.status === 'paid' ? 'default' : 'secondary'}>{p.status}</Badge>
                      </div>
                    )) ?? null}
                    {!payoutsQ.data?.length && <div className="p-3 text-xs text-muted-foreground">No payouts.</div>}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="font-medium break-all">{value}</div>
  </div>
);

export default AdminPartners;
