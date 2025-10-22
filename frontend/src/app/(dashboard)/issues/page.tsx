'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppLayout } from '@/components/layouts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function IssuesPage() {
  return (
    <AuthGuard requireAuth={true}>
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Issues</h1>
            <p className="text-gray-600 mt-1">Track and manage issues</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Issues</CardTitle>
              <CardDescription>No issues assigned to you</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Issues you create or are assigned to will appear here.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
