'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppLayout } from '@/components/layouts';
import { useAuthStore } from '@/lib/stores/authStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FolderGit2, CircleDot, GitPullRequest, Star } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const stats = [
    {
      title: 'Repositories',
      value: '0',
      icon: FolderGit2,
      description: 'Total repositories',
    },
    {
      title: 'Issues',
      value: '0',
      icon: CircleDot,
      description: 'Open issues',
    },
    {
      title: 'Pull Requests',
      value: '0',
      icon: GitPullRequest,
      description: 'Open PRs',
    },
    {
      title: 'Starred',
      value: '0',
      icon: Star,
      description: 'Starred repos',
    },
  ];

  return (
    <AuthGuard requireAuth={true}>
      <AppLayout>
        <div className="space-y-6">
          {/* Welcome Card */}
          <Card>
            <CardHeader>
              <CardTitle>Welcome back, {user?.name || user?.username}! 👋</CardTitle>
              <CardDescription>
                Here&apos;s an overview of your GitHub Clone activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Username:</strong> {user?.username}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Email:</strong> {user?.email}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                    </div>
                    <stat.icon className="h-8 w-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest actions across repositories</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                No recent activity yet. Start by creating a repository!
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
