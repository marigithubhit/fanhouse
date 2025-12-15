export interface User {
  id: number;
  email: string;
  username: string;
  role: 'fan' | 'creator' | 'admin';
  created_at: Date;
  updated_at: Date;
}

export interface CreatorProfile {
  id: number;
  user_id: number;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  persona_inquiry_id?: string;
  subscription_price: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
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
  created_at: Date;
  updated_at: Date;
}

export interface Subscription {
  id: number;
  fan_id: number;
  creator_id: number;
  status: 'active' | 'cancelled' | 'expired';
  started_at: Date;
  expires_at?: Date;
}

export interface PPVUnlock {
  id: number;
  fan_id: number;
  post_id: number;
  unlocked_at: Date;
}

export interface LedgerEntry {
  id: number;
  transaction_id: string;
  user_id?: number;
  creator_id?: number;
  transaction_type: 'subscription' | 'ppv_unlock' | 'tip' | 'payout' | 'refund';
  amount: number;
  currency: string;
  payment_provider: string;
  payment_provider_transaction_id?: string;
  metadata?: any;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: Date;
}

export interface Notification {
  id: number;
  user_id: number;
  notification_type: string;
  title: string;
  message?: string;
  metadata?: any;
  is_read: boolean;
  created_at: Date;
}

export interface AuthRequest extends Express.Request {
  user?: User;
}
