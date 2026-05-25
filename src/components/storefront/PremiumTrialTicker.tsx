import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getPremiumTrialStatus, type PendingPremiumTheme } from '@/lib/premiumThemeTrial';

interface Props {
  storeId?: string;
  storeUserId?: string | null;
  settings?: any;
}

/**
 * Thin top ticker that ONLY appears for the store owner while viewing their
 * own storefront. Counts down the 14-day free trial of a premium theme and
 * nudges them to pay before service is interrupted. Never visible to customers.
 */
const PremiumTrialTicker = ({ storeId, storeUserId, settings }: Props) => {
  const pending = (settings as any)?.pending_premium_theme as PendingPremiumTheme | undefined;
  const [isOwner, setIsOwner] = useState(false);
  const [, setTick] = useState(0);

  // Re-render every minute so the countdown ticks live.
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!pending) return;
      const { data } = await supabase.auth.getUser();
      if (cancel) return;
      const uid = data.user?.id;
      // Treat a logged-in seller (non-customer) whose id matches the store owner as the owner.
      const isCustomer = !!data.user?.user_metadata?.is_customer;
      setIsOwner(!!uid && !isCustomer && !!storeUserId && uid === storeUserId);
    })();
    return () => { cancel = true; };
  }, [pending, storeUserId, storeId]);

  if (!pending || !isOwner) return null;
  const trial = getPremiumTrialStatus(pending);
  if (!trial.active && !trial.expired) return null;

  const expired = trial.expired;
  const urgent = trial.active && trial.daysLeft <= 3;

  const bg = expired
    ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600'
    : urgent
    ? 'bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600'
    : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500';

  const label = expired
    ? 'Free trial ended — premium theme service will be paused. Pay now to keep it live.'
    : `Premium theme free trial: ${trial.daysLeft} day${trial.daysLeft === 1 ? '' : 's'} left. Pay to keep uninterrupted service.`;

  return (
    <div className={`${bg} text-white text-xs sm:text-sm font-medium`}>
      <div className="max-w-6xl mx-auto px-4 py-1.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {expired ? <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> : <Clock className="h-3.5 w-3.5 shrink-0" />}
          <span className="truncate">{label}</span>
        </div>
        <Link
          to="/dashboard"
          className="shrink-0 inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold transition"
        >
          <Crown className="h-3 w-3" /> Pay now
        </Link>
      </div>
    </div>
  );
};

export default PremiumTrialTicker;
