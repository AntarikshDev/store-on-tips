import { useStore } from '@/hooks/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { usePremiumThemePurchase } from '@/hooks/usePremiumThemePurchase';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { applyMasterTheme } from '@/lib/applyMasterTheme';

/**
 * Shows when the merchant chose a premium theme but skipped payment.
 * Reads stores.settings.pending_premium_theme.
 */
const PremiumThemePendingCard = () => {
  const { store, refetchStore } = useStore();
  const { purchase, loading } = usePremiumThemePurchase();
  const [dismissed, setDismissed] = useState(false);

  const pending = (store?.settings as any)?.pending_premium_theme as
    | { theme_id: string; selected_at?: string } | undefined;

  const { data: themeMeta } = useQuery({
    queryKey: ['theme-meta', pending?.theme_id],
    enabled: !!pending?.theme_id,
    queryFn: async () => {
      const { data } = await supabase.from('theme_master_projects')
        .select('name, preview_image, price')
        .eq('theme_id', pending!.theme_id).maybeSingle();
      return data;
    },
  });

  if (!pending || dismissed || !themeMeta) return null;

  const handlePay = async () => {
    const ok = await purchase('master', pending.theme_id);
    if (ok && store) {
      // Activate the theme now that it's paid
      try {
        const { data: fresh } = await supabase.from('stores')
          .select('settings').eq('id', store.id).maybeSingle();
        await applyMasterTheme(store.id, pending.theme_id, (fresh?.settings as any) || {});
        await refetchStore();
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 relative overflow-hidden">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 p-1 rounded-md hover:bg-background/40 transition"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4 px-4">
        {themeMeta.preview_image && (
          <img src={themeMeta.preview_image} alt={themeMeta.name}
               className="h-16 w-24 rounded-lg object-cover border border-border shadow-md flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            <Crown className="h-3.5 w-3.5" /> Premium theme reserved
          </div>
          <p className="text-sm font-semibold mt-0.5">{themeMeta.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Pay <span className="font-bold text-foreground">₹{themeMeta.price}</span> to unlock the Customiser and activate this design.
            <span className="hidden sm:inline">Launch discount applied at checkout.</span>
          </p>
        </div>
        <Button onClick={handlePay} disabled={loading} className="gap-2 shadow-lg shadow-amber-500/20">
          <Crown className="h-4 w-4" />
          {loading ? 'Opening…' : 'Pay & Activate'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PremiumThemePendingCard;
