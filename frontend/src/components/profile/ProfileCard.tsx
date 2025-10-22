import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/lib/types';

interface ProfileCardProps {
  user: User;
}

export function ProfileCard({ user }: ProfileCardProps) {
  const initials = (user.name || user.username)
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>User information overview</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.avatarUrl || undefined} alt={user.username} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">{user.name || user.username}</h2>
            <p className="text-gray-600">@{user.username}</p>
            {user.bio && <p className="text-gray-700">{user.bio}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-600 mt-2">
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              {user.company && (
                <p>
                  <strong>Company:</strong> {user.company}
                </p>
              )}
              {user.location && (
                <p>
                  <strong>Location:</strong> {user.location}
                </p>
              )}
              {user.website && (
                <p>
                  <strong>Website:</strong>{' '}
                  <a
                    href={user.website}
                    className="text-blue-600 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {user.website}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
