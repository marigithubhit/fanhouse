export interface User {
  id: number;
  email: string;
  username: string;
  role: 'fan' | 'creator' | 'admin';
}

export interface Creator {
  id: number;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  subscription_price: number;
  verification_status?: 'pending' | 'approved' | 'rejected';
  is_active?: boolean;
}

export interface Post {
  id: number;
  creator_id: number;
  title?: string;
  content?: string;
  media_url?: string;
  media_type?: string;
  access_type: 'public' | 'subscriber' | 'ppv';
  ppv_price?: number;
  is_active: boolean;
  created_at: string;
  creator_username?: string;
  creator_display_name?: string;
  creator_avatar?: string;
  locked?: boolean;
  unlock_type?: 'subscription' | 'ppv';
}

export interface Subscription {
  id: number;
  fan_id: number;
  creator_id: number;
  status: 'active' | 'cancelled' | 'expired';
  started_at: string;
  expires_at?: string;
  creator_username?: string;
  creator_display_name?: string;
  creator_avatar?: string;
}

export interface Transaction {
  id: number;
  transaction_id: string;
  transaction_type: 'subscription' | 'ppv_unlock' | 'tip' | 'payout' | 'refund';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
}
