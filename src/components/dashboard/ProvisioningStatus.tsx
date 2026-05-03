import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/hooks/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, AlertTriangle, Rocket, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STAGES = [
  { key: 'queued', label: 'Queued', pct: 10 },
  { key: 'remixing', label: 'Forking theme', pct: 35 },
  { key: 'patching', label: 'Customising for your store', pct: 65 },
  { key: 'domain_pending', label: 'Connecting domain', pct: 85 },
  { key: 'live', label: 'Live', pct: 100 },
];

const ProvisioningStatus = () => {
  const { store } = useStore();

  const { data: req } = useQuery({
    queryKey: ['my-provision-status', store?.id],
    enabled: !!store?.id,
    refetchInterval: 8_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provision_requests')
        .select('id, status, error, queued_at, completed_at, new_project_url, attempts')
        .eq('store_id', store!.id)
        .order('queued_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!req) return null;
  if (req.status === 'live' && req.completed_at) {
    // hide once acknowledged after 1h
    const ageMs = Date.now() - new Date(req.completed_at).getTime();
    if (ageMs > 60 * 60 * 1000) return null;
  }

  const stage = STAGES.find((s) => s.key === req.status) || STAGES[0];
  const isFailed = req.status === 'failed';
  const isLive = req.status === 'live';

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="py-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            {isLive ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            ) : isFailed ? (
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            ) : (
              <Loader2 className="h-5 w-5 text-primary animate-spin mt-0.5" />
            )}
            <div>
              <p className="font-semibold text-sm flex items-center gap-2">
                {isLive ? 'Your storefront is live!' : isFailed ? 'Provisioning needs attention' : 'Provisioning your storefront…'}
                <Badge variant="secondary" className="text-[10px]">{stage.label}</Badge>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isLive
                  ? 'Visit your store anytime from the dashboard.'
                  : isFailed
                    ? req.error || 'We hit a snag. Our team will retry shortly.'
                    : 'This usually takes 2–5 minutes. Feel free to keep working — we\'ll notify you when it\'s ready.'}
              </p>
            </div>
          </div>
          {isLive && req.new_project_url && (
            <Button asChild size="sm" variant="outline">
              <a href={req.new_project_url} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-1 h-3.5 w-3.5" /> Open
              </a>
            </Button>
          )}
        </div>
        {!isFailed && <Progress value={stage.pct} className="h-1.5" />}
      </CardContent>
    </Card>
  );
};

export default ProvisioningStatus;
