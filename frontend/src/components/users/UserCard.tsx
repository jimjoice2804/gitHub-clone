import Link from 'next/link';
import { User } from '@/lib/types';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Building2 } from 'lucide-react';
import { FollowButton } from '@/components/users/FollowButton';
import { useAuthStore } from '@/lib/stores/authStore';

interface UserCardProps {
  user: User;
}

export function UserCard({ user }: UserCardProps) {
  const { user: currentUser } = useAuthStore();
  const initials = user.username
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start gap-4">
          <Link href={`/profile/${user.username}`}>
            <Avatar className="h-16 w-16 cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarImage src={user.avatarUrl || undefined} alt={user.username} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              href={`/profile/${user.username}`}
              className="text-lg font-semibold hover:text-blue-600 transition-colors"
            >
              {user.name || user.username}
            </Link>
            <div className="text-sm text-gray-600">@{user.username}</div>
            {user.bio && <p className="text-sm text-gray-700 mt-2 line-clamp-2">{user.bio}</p>}
          </div>
          {currentUser?.username !== user.username && <FollowButton username={user.username} />}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          {user.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{user.location}</span>
            </div>
          )}
          {user.company && (
            <div className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              <span>{user.company}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
