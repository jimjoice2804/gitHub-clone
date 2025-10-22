'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppLayout } from '@/components/layouts';
import { userApi } from '@/lib/api/user';
import type { UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FollowersList } from '@/components/users/FollowersList';
import { FollowingList } from '@/components/users/FollowingList';
import { FollowButton } from '@/components/users/FollowButton';
import { MapPin, Building2, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/stores/authStore';

export default function UserProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params?.username;
  const { user: currentUser } = useAuthStore();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    const load = async () => {
      try {
        setLoading(true);
        const data = await userApi.getUserProfile(username);
        setProfile(data);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [username]);

  const initials = (profile?.name || profile?.username || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <AuthGuard requireAuth={true}>
      <AppLayout>
        <div className="space-y-6">
          {!loading && profile && (
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatarUrl || undefined} alt={profile.username} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold">{profile.name || profile.username}</h1>
                <p className="text-gray-600">@{profile.username}</p>
                {profile.bio && <p className="text-gray-700 mt-2">{profile.bio}</p>}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-3">
                  {profile.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> {profile.location}
                    </span>
                  )}
                  {profile.company && (
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="h-4 w-4" /> {profile.company}
                    </span>
                  )}
                  {profile.website && (
                    <Link
                      href={profile.website}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      <LinkIcon className="h-4 w-4" /> {profile.website}
                    </Link>
                  )}
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  <span className="mr-4">
                    <strong>{profile.stats.followers}</strong> followers
                  </span>
                  <span>
                    <strong>{profile.stats.following}</strong> following
                  </span>
                </div>
              </div>
              {currentUser?.username !== profile.username && (
                <FollowButton username={profile.username} initialFollowing={profile.isFollowing} />
              )}
            </div>
          )}

          <Tabs defaultValue="followers">
            <TabsList>
              <TabsTrigger value="followers">Followers</TabsTrigger>
              <TabsTrigger value="following">Following</TabsTrigger>
            </TabsList>
            <TabsContent value="followers">
              {username && <FollowersList username={username} />}
            </TabsContent>
            <TabsContent value="following">
              {username && <FollowingList username={username} />}
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
