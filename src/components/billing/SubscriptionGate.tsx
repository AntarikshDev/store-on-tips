import { useNavigate, useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscriptionAccess } from '@/hooks/useSubscriptionAccess';

const ALLOWED = ['/billing', '/auth', '/admin'];

/**
 * Full-screen gate shown when the merchant's paid subscription grace has ended.
 * Allows access only to billing/auth to make payment.
 */
export const SubscriptionGate = ({ children }: { children: React.ReactNode }) => {
  const { isBlocked, loading } = useSubscriptionAccess();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (loading || !isBlocked) return <>{children}</>;
  if (ALLOWED.some((p) => pathname.startsWith(p))) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md text-center space-y-4">
        <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <Lock className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold">Subscription Paused</h1>
        <p className="text-muted-foreground">
          Your monthly subscription payment is overdue and the 15-day grace period has ended.
          Renew now to instantly restore access to your dashboard and storefront.
        </p>
        <Button size="lg" className="w-full" onClick={() => navigate('/billing')}>
          Renew subscription
        </Button>
      </div>
    </div>
  );
};
