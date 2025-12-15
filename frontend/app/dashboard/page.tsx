'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import type { User, Post, Creator } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (!token || !userStr) {
        router.push('/login');
        return;
      }

      const userData = JSON.parse(userStr);
      setUser(userData);

      try {
        const [postsRes, creatorsRes] = await Promise.all([
          api.get('/posts'),
          api.get('/creators')
        ]);

        setPosts(postsRes.data.posts || []);
        setCreators(creatorsRes.data.creators || []);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

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
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              FanHouse
            </h1>
            <p className="text-sm text-muted-foreground">
              Welcome, {user?.username}
            </p>
          </div>
          <div className="flex gap-2">
            {user?.role === 'creator' && (
              <Link href="/dashboard/create-post">
                <Button>Create Post</Button>
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link href="/admin">
                <Button variant="outline">Admin Panel</Button>
              </Link>
            )}
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Latest Posts</h2>
              {posts.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No posts yet
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {posts.slice(0, 10).map((post) => (
                    <Card key={post.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {post.title || 'Untitled Post'}
                            </CardTitle>
                            <CardDescription>
                              by {post.creator_display_name || post.creator_username}
                            </CardDescription>
                          </div>
                          <div className="text-sm">
                            {post.access_type === 'public' && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                                Public
                              </span>
                            )}
                            {post.access_type === 'subscriber' && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                Subscribers Only
                              </span>
                            )}
                            {post.access_type === 'ppv' && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                PPV ${post.ppv_price}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      {!post.locked && (
                        <CardContent>
                          <p className="text-sm">{post.content}</p>
                        </CardContent>
                      )}
                      {post.locked && (
                        <CardContent>
                          <p className="text-sm text-muted-foreground italic">
                            {post.unlock_type === 'subscription'
                              ? 'Subscribe to view this content'
                              : `Unlock for $${post.ppv_price}`}
                          </p>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Creators</h2>
              <div className="space-y-3">
                {creators.slice(0, 5).map((creator) => (
                  <Card key={creator.id}>
                    <CardContent className="p-4">
                      <div className="font-medium">
                        {creator.display_name || creator.username}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ${creator.subscription_price}/month
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
