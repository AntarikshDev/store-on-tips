import { useSubscription } from './useSubscription';

/**
 * Derives lifecycle state for the current store's subscription:
 * - isBlocked: paid plan with grace ended → must pay to regain access
 * - inGrace: payment overdue, still within 15-day grace
 * - graceDaysLeft: integer days until block (null if not in grace)
 * - pendingPlan: scheduled downgrade target
 */
export const useSubscriptionAccess = () => {
  const { subscription, plan, loading } = useSubscription();
  const s: any = subscription;

  const isBlocked = !!s?.is_blocked && plan !== 'free';
  const graceEnd = s?.grace_period_end ? new Date(s.grace_period_end) : null;
  const inGrace = !!graceEnd && !isBlocked && graceEnd.getTime() > Date.now();
  const graceDaysLeft = graceEnd && inGrace
    ? Math.max(0, Math.ceil((graceEnd.getTime() - Date.now()) / 86400_000))
    : null;
  const pendingPlan = s?.pending_plan ?? null;
  const pendingPlanEffectiveAt = s?.pending_plan_effective_at ?? null;

  return {
    isBlocked,
    inGrace,
    graceDaysLeft,
    graceEnd,
    pendingPlan,
    pendingPlanEffectiveAt,
    loading,
  };
};
