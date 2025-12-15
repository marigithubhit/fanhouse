'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';

export default function CreatePostPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    access_type: 'public' as 'public' | 'subscriber' | 'ppv',
    ppv_price: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('content', formData.content);
      data.append('access_type', formData.access_type);

      if (formData.access_type === 'ppv' && formData.ppv_price) {
        data.append('ppv_price', formData.ppv_price);
      }

      if (file) {
        data.append('media', file);
      }

      await api.post('/posts', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Create Post</h1>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>New Post</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Post title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your post content..."
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="media">Media (optional)</Label>
                <Input
                  id="media"
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground">
                  Upload images or videos (max 10MB)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="access_type">Access Type</Label>
                <Select
                  value={formData.access_type}
                  onValueChange={(value: 'public' | 'subscriber' | 'ppv') =>
                    setFormData({ ...formData, access_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select access type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public (Free)</SelectItem>
                    <SelectItem value="subscriber">Subscribers Only</SelectItem>
                    <SelectItem value="ppv">Pay-Per-View</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.access_type === 'ppv' && (
                <div className="space-y-2">
                  <Label htmlFor="ppv_price">PPV Price ($)</Label>
                  <Input
                    id="ppv_price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.ppv_price}
                    onChange={(e) => setFormData({ ...formData, ppv_price: e.target.value })}
                    placeholder="9.99"
                    required={formData.access_type === 'ppv'}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Post'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
