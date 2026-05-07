/**
 * Minimal subset of types from web src/integrations/supabase/types.ts
 * Full types.ts is 3000 LOC — only the tables/enums we touch in V1 are typed here.
 * Add as needed; falling through to `any` is safe because Supabase responses
 * are already validated by RLS server-side.
 */

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'cod';

export interface Store {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  logo_url: string | null;
  banner_url: string | null;
  theme: any | null;
  settings: any | null;
  is_published: boolean | null;
  onboarding_step: number | null;
  custom_domain: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  price: number;
  compare_at_price: number | null;
  category: string | null;
  images: string[] | null;
  inventory_count: number | null;
  is_active: boolean | null;
  sku: string | null;
  tags: string[] | null;
  variants: any | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  store_id: string;
  order_number: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_address: any | null;
  items: any;
  subtotal: number | null;
  tax: number | null;
  shipping: number | null;
  total: number | null;
  status: OrderStatus | null;
  payment_status: PaymentStatus | null;
  payment_method: string | null;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  store_id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  saved_addresses: any | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AICreditWallet {
  store_id: string;
  balance: number;
  lifetime_used: number;
  lifetime_purchased: number;
  loyalty_tier: string;
  auto_recharge_enabled: boolean;
}
