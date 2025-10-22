'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppLayout } from '@/components/layouts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function DiscussionsPage() {
  return (
    <AuthGuard requireAuth={true}>
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Discussions</h1>
            <p className="text-gray-600 mt-1">Participate in community discussions</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Discussions</CardTitle>
              <CardDescription>No discussions found</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Discussions you participate in will appear here.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
