import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface Dispute {
  id: string;
  razorpay_dispute_id: string | null;
  razorpay_payment_id: string | null;
  store_id: string | null;
  order_id: string | null;
  amount_inr: number;
  reason_code: string | null;
  reason_description: string | null;
  status: string;
  phase: string | null;
  respond_by: string | null;
  created_at: string;
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  open: 'destructive',
  under_review: 'default',
  won: 'secondary',
  lost: 'destructive',
  closed: 'outline',
};

const AdminDisputes = () => {
  const qc = useQueryClient();
  const { data: disputes = [], isLoading } = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disputes' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as Dispute[];
    },
    refetchInterval: 60_000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('disputes' as any).update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-disputes'] });
      toast.success('Status updated');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const open = disputes.filter((d) => ['open', 'under_review'].includes(d.status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldAlert className="h-6 w-6" /> Payment Disputes
        </h1>
        <p className="text-sm text-muted-foreground">Razorpay chargebacks and disputes mirrored via webhook.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4"><div className="text-xs text-muted-foreground">Open</div><div className="text-2xl font-bold mt-1">{open.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Won (90d)</div><div className="text-2xl font-bold mt-1">{disputes.filter((d) => d.status === 'won').length}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Lost (90d)</div><div className="text-2xl font-bold mt-1">{disputes.filter((d) => d.status === 'lost').length}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">Total amount at risk</div><div className="text-2xl font-bold mt-1">₹{open.reduce((s, d) => s + Number(d.amount_inr ?? 0), 0).toLocaleString('en-IN')}</div></Card>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr className="text-left">
              <th className="px-4 py-2">Created</th>
              <th className="px-4 py-2">Razorpay ID</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Reason</th>
              <th className="px-4 py-2">Respond By</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
            {!isLoading && disputes.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No disputes — all clear. 🎉</td></tr>
            )}
            {disputes.map((d) => (
              <tr key={d.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-2 text-xs whitespace-nowrap">{new Date(d.created_at).toLocaleString()}</td>
                <td className="px-4 py-2 text-xs font-mono">{d.razorpay_dispute_id}</td>
                <td className="px-4 py-2 font-medium">₹{Number(d.amount_inr).toLocaleString('en-IN')}</td>
                <td className="px-4 py-2 text-xs">{d.reason_description ?? d.reason_code ?? '—'}</td>
                <td className="px-4 py-2 text-xs">{d.respond_by ? new Date(d.respond_by).toLocaleDateString() : '—'}</td>
                <td className="px-4 py-2"><Badge variant={statusVariant[d.status] ?? 'secondary'}>{d.status}</Badge></td>
                <td className="px-4 py-2">
                  <Select value={d.status} onValueChange={(v) => updateStatus.mutate({ id: d.id, status: v })}>
                    <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="under_review">Under review</SelectItem>
                      <SelectItem value="won">Won</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="p-4 bg-muted/30 text-xs text-muted-foreground">
        <strong>Webhook URL:</strong> Configure Razorpay webhook for <code>payment.dispute.*</code> events to:
        <code className="ml-1 break-all">{import.meta.env.VITE_SUPABASE_URL}/functions/v1/razorpay-disputes-webhook</code>
      </Card>
    </div>
  );
};

export default AdminDisputes;
