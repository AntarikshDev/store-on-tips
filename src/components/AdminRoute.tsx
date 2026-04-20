import { ReactNode, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'admin_last_activity';
const TTL_KEY = 'admin_session_timeout_min';
const DEFAULT_TTL_MIN = 480;

const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdminRole();
  const location = useLocation();
  const fetchedRef = useRef(false);

  // Load TTL from server once, then enforce sliding window from localStorage.
  useEffect(() => {
    if (!isAdmin || fetchedRef.current) return;
    fetchedRef.current = true;
    supabase.from('admin_settings').select('session_timeout_minutes').eq('id', 1).maybeSingle()
      .then(({ data }) => {
        if (data?.session_timeout_minutes) localStorage.setItem(TTL_KEY, String(data.session_timeout_minutes));
      });
  }, [isAdmin]);

  // On every route change, check expiry & refresh activity timestamp.
  useEffect(() => {
    if (!isAdmin) return;
    const ttlMin = Number(localStorage.getItem(TTL_KEY) ?? DEFAULT_TTL_MIN);
    const last = Number(localStorage.getItem(STORAGE_KEY) ?? Date.now());
    if (Date.now() - last > ttlMin * 60_000) {
      localStorage.removeItem(STORAGE_KEY);
      signOut();
      return;
    }
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  }, [location.pathname, isAdmin, signOut]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default AdminRoute;
