'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppLayout } from '@/components/layouts';
import { useAuthStore } from '@/lib/stores/authStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { AvatarUploader } from '@/components/profile/AvatarUploader';
import { EditProfileForm } from '@/components/profile/EditProfileForm';

export default function ProfilePage() {
  const { user } = useAuthStore();

  return (
    <AuthGuard requireAuth={true}>
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Your Profile</h1>
            <p className="text-gray-600 mt-1">View and update your personal information</p>
          </div>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="edit">Edit Profile</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-6">
              {user && <ProfileCard user={user} />}
              <Card>
                <CardHeader>
                  <CardTitle>Avatar</CardTitle>
                  <CardDescription>Update your profile picture</CardDescription>
                </CardHeader>
                <CardContent>
                  <AvatarUploader />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="edit" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Edit Profile</CardTitle>
                  <CardDescription>Update your public profile information</CardDescription>
                </CardHeader>
                <CardContent>
                  <EditProfileForm />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
