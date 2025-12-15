'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';

interface Creator {
  id: number;
  username: string;
  email: string;
  display_name: string;
  verification_status: string;
  is_active: boolean;
  subscription_price: number;
}

interface Transaction {
  id: number;
  transaction_id: string;
  transaction_type: string;
  amount: number;
  status: string;
  created_at: string;
  user_username: string;
  creator_username: string;
}

interface Stats {
  total_fans: number;
  total_creators: number;
  approved_creators: number;
  total_posts: number;
  active_subscriptions: number;
  total_revenue: number;
  subscription_revenue: number;
  ppv_revenue: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (!token || !userStr) {
        router.push('/login');
        return;
      }

      const user = JSON.parse(userStr);
      if (user.role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      try {
        const [creatorsRes, transactionsRes, statsRes] = await Promise.all([
          api.get('/admin/creators'),
          api.get('/admin/transactions?limit=20'),
          api.get('/admin/stats')
        ]);

        setCreators(creatorsRes.data.creators || []);
        setTransactions(transactionsRes.data.transactions || []);
        setStats(statsRes.data);
      } catch (error) {
        console.error('Failed to load admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleVerifyCreator = async (creatorId: number, status: 'approved' | 'rejected') => {
    try {
      await api.post(`/admin/creators/${creatorId}/verify`, { status });

      setCreators(creators.map(c =>
        c.id === creatorId ? { ...c, verification_status: status } : c
      ));
    } catch (error) {
      console.error('Failed to verify creator:', error);
    }
  };

  const handleToggleCreator = async (creatorId: number, isActive: boolean) => {
    try {
      await api.post(`/admin/creators/${creatorId}/toggle`, { is_active: isActive });

      setCreators(creators.map(c =>
        c.id === creatorId ? { ...c, is_active: isActive } : c
      ));
    } catch (error) {
      console.error('Failed to toggle creator:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">FanHouse Administration</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Dashboard
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Fans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_fans}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Creators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_creators}</div>
                <div className="text-xs text-muted-foreground">
                  {stats.approved_creators} approved
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.active_subscriptions}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.total_revenue.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">
                  ${stats.subscription_revenue.toFixed(2)} subs | ${stats.ppv_revenue.toFixed(2)} PPV
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Creators */}
        <Card>
          <CardHeader>
            <CardTitle>Creators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {creators.map((creator) => (
                <div key={creator.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{creator.display_name || creator.username}</div>
                    <div className="text-sm text-muted-foreground">{creator.email}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Status: {creator.verification_status} | ${creator.subscription_price}/month
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {creator.verification_status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleVerifyCreator(creator.id, 'approved')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleVerifyCreator(creator.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {creator.verification_status === 'approved' && (
                      <Button
                        size="sm"
                        variant={creator.is_active ? 'destructive' : 'default'}
                        onClick={() => handleToggleCreator(creator.id, !creator.is_active)}
                      >
                        {creator.is_active ? 'Disable' : 'Enable'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {transactions.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="text-sm">
                    <div className="font-medium">{txn.transaction_type.replace('_', ' ')}</div>
                    <div className="text-xs text-muted-foreground">
                      {txn.user_username} → {txn.creator_username}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${txn.amount}</div>
                    <div className="text-xs text-muted-foreground">{txn.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
