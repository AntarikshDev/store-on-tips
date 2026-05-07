import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Store } from '../types/database';

interface StoreContextValue {
  store: Store | null;
  loading: boolean;
  setStore: React.Dispatch<React.SetStateAction<Store | null>>;
  refetchStore: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStore = useCallback(async () => {
    if (!user) {
      setStore(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    // CRITICAL: order+limit instead of .maybeSingle() — fixes onboarding-loop bug
    // when a user has multiple stores (legacy/test fixtures).
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) {
      console.error('[StoreContext] fetch error:', error);
      setLoading(false);
      return;
    }
    setStore(((data as Store[] | null)?.[0]) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    fetchStore();
  }, [authLoading, fetchStore]);

  return (
    <StoreContext.Provider
      value={{
        store,
        loading: loading || authLoading,
        setStore,
        refetchStore: fetchStore,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStoreContext = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStoreContext must be used within StoreProvider');
  return ctx;
};
