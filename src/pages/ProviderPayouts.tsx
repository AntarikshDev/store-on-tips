import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/hooks/useStore';
import PageHeader from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, IndianRupee, CheckCircle2, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function ProviderPayouts() {
  const { store } = useStore();
  const qc = useQueryClient();
  const storeId = store?.id;

  const { data: rows, isLoading } = useQuery({
    queryKey: ['provider-commissions', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from('provider_commissions' as any)
        .select('*, service_providers(name)')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as any[]) ?? [];
    },
    enabled: !!storeId,
  });

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('provider_commissions' as any)
        .update({ payout_status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['provider-commissions', storeId] });
      toast.success('Marked as paid');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const totals = useMemo(() => {
    const pending = (rows ?? []).filter((r) => r.payout_status === 'pending').reduce((s, r) => s + Number(r.amount), 0);
    const paid = (rows ?? []).filter((r) => r.payout_status === 'paid').reduce((s, r) => s + Number(r.amount), 0);
    return { pending, paid };
  }, [rows]);

  const exportCsv = () => {
    if (!rows) return;
    const header = 'Date,Provider,Base,Pct,Amount,Status,PaidAt\n';
    const body = rows.map((r) => [
      new Date(r.created_at).toISOString(),
      (r.service_providers?.name ?? '').replace(/,/g, ' '),
      r.base_amount, r.commission_pct, r.amount, r.payout_status, r.paid_at ?? '',
    ].join(',')).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `provider-payouts-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <PageHeader title="Provider Payouts" subtitle="Commissions accrued from completed appointments" />

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Pending payout</div>
          <div className="text-2xl font-bold flex items-center"><IndianRupee className="w-5 h-5" />{totals.pending.toFixed(0)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Paid out</div>
          <div className="text-2xl font-bold flex items-center"><IndianRupee className="w-5 h-5" />{totals.paid.toFixed(0)}</div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={exportCsv}><Download className="w-4 h-4 mr-1" />Export CSV</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : (rows ?? []).length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No commissions yet. They accrue when an appointment is marked completed.</Card>
      ) : (
        <div className="space-y-2">
          {rows!.map((r) => (
            <Card key={r.id} className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{r.service_providers?.name || '—'}</div>
                <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString('en-IN')} · {r.commission_pct}% of ₹{Number(r.base_amount).toFixed(0)}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-semibold flex items-center justify-end"><IndianRupee className="w-3.5 h-3.5" />{Number(r.amount).toFixed(0)}</div>
                  <Badge variant={r.payout_status === 'paid' ? 'default' : 'outline'} className="text-[10px]">{r.payout_status}</Badge>
                </div>
                {r.payout_status === 'pending' && (
                  <Button size="sm" variant="outline" onClick={() => markPaid.mutate(r.id)}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />Mark paid
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
