'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppLayout } from '@/components/layouts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function PullRequestsPage() {
  return (
    <AuthGuard requireAuth={true}>
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Pull Requests</h1>
            <p className="text-gray-600 mt-1">Review and manage pull requests</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Pull Requests</CardTitle>
              <CardDescription>No pull requests found</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Pull requests you create or are assigned to will appear here.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
