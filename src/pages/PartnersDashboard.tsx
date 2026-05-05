import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Copy, IndianRupee, Users, Wallet, Share2 } from 'lucide-react';

const PartnersDashboard = () => {
  const { user, signOut } = useAuth();

  const partnerQ = useQuery({
    enabled: !!user,
    queryKey: ['partner', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const partner = partnerQ.data;

  const refsQ = useQuery({
    enabled: !!partner,
    queryKey: ['partner-referrals', partner?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_referrals')
        .select('*')
        .eq('partner_id', partner!.id)
        .order('signed_up_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const commQ = useQuery({
    enabled: !!partner,
    queryKey: ['partner-commissions', partner?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_commissions')
        .select('*')
        .eq('partner_id', partner!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const payoutsQ = useQuery({
    enabled: !!partner,
    queryKey: ['partner-payouts', partner?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_payouts')
        .select('*')
        .eq('partner_id', partner!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!user) return <Navigate to="/auth?redirect=/partners/dashboard" replace />;
  if (partnerQ.isLoading) return <div className="p-12 text-center">Loading...</div>;
  if (!partner) return <Navigate to="/partners/signup" replace />;

  const referralLink = `${window.location.origin}/?ref=${partner.referral_code}`;
  const totalReferrals = refsQ.data?.length ?? 0;
  const paidReferrals = refsQ.data?.filter((r) => r.status === 'paid').length ?? 0;
  const pendingAmount = (commQ.data ?? [])
    .filter((c) => c.status === 'pending' || c.status === 'approved')
    .reduce((s, c) => s + Number(c.commission_amount), 0);
  const paidAmount = (payoutsQ.data ?? [])
    .filter((p) => p.status === 'paid')
    .reduce((s, p) => s + Number(p.amount), 0);

  const copy = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Link copied');
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="border-b bg-background">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600" />
            <div className="font-semibold">Partner Dashboard</div>
            <Badge variant={partner.kyc_status === 'approved' ? 'default' : 'secondary'}>
              KYC: {partner.kyc_status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/dashboard"><Button variant="ghost" size="sm">My Store</Button></Link>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>Sign out</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <Card className="border-0 shadow-md bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm opacity-90 mb-2">
              <Share2 className="h-4 w-4" /> Your referral link
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded bg-white/15 text-sm break-all">{referralLink}</code>
              <Button onClick={copy} variant="secondary" size="sm"><Copy className="h-4 w-4 mr-1" />Copy</Button>
            </div>
            <p className="text-xs opacity-80 mt-2">
              Share anywhere. Sellers who sign up via this link earn you {partner.commission_pct}% for {partner.commission_months} months.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total signups" value={totalReferrals} />
          <StatCard icon={Users} label="Paid sellers" value={paidReferrals} />
          <StatCard icon={Wallet} label="Pending payout" value={`₹${pendingAmount.toFixed(0)}`} accent />
          <StatCard icon={IndianRupee} label="Lifetime paid" value={`₹${paidAmount.toFixed(0)}`} />
        </div>

        <Card>
          <CardHeader><CardTitle>Referrals</CardTitle></CardHeader>
          <CardContent>
            {refsQ.data?.length ? (
              <div className="divide-y">
                {refsQ.data.map((r) => (
                  <div key={r.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">Store {r.store_id?.slice(0, 8) ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">
                        Signed up {new Date(r.signed_up_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant={r.status === 'paid' ? 'default' : 'secondary'}>{r.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No referrals yet. Share your link to start earning.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Payouts</CardTitle></CardHeader>
          <CardContent>
            {payoutsQ.data?.length ? (
              <div className="divide-y">
                {payoutsQ.data.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">₹{Number(p.amount).toFixed(0)}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.period ?? new Date(p.created_at).toLocaleDateString()}
                        {p.utr ? ` · UTR ${p.utr}` : ''}
                      </div>
                    </div>
                    <Badge variant={p.status === 'paid' ? 'default' : 'secondary'}>{p.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No payouts yet.</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, accent }: any) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className={`text-2xl font-bold ${accent ? 'text-violet-600' : ''}`}>{value}</div>
    </CardContent>
  </Card>
);

export default PartnersDashboard;
