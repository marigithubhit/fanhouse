import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            FanHouse
          </CardTitle>
          <CardDescription>
            Exclusive creator platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Link href="/login">
              <Button className="w-full" size="lg">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="w-full" variant="outline" size="lg">
                Create Account
              </Button>
            </Link>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            <Link href="/creators" className="hover:text-primary">
              Browse Creators
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
