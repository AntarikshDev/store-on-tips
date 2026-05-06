import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export const useCustomerAuth = (storeSlug: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const normalizeEmail = (value: string) => value.trim().toLowerCase();

  const getTenantEmail = (value: string) => {
    const normalized = normalizeEmail(value);
    const [localPart, domain] = normalized.split('@');
    if (!localPart || !domain || !storeSlug) return normalized;
    return `${localPart}+${storeSlug}@${domain}`;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: getTenantEmail(email), password });
    return { data, error };
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    const realEmail = normalizeEmail(email);
    const { data, error } = await supabase.auth.signUp({
      email: getTenantEmail(realEmail),
      password,
      options: {
        data: { full_name: fullName, is_customer: true, store_slug: storeSlug, customer_email: realEmail },
        emailRedirectTo: `${window.location.origin}/store/${storeSlug}/account`,
      },
    });
    return { data, error };
  };

  const signInWithOtp = async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    return { error };
  };

  const verifyOtp = async (phone: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, loading, signInWithEmail, signUpWithEmail, signInWithOtp, verifyOtp, signOut };
};
