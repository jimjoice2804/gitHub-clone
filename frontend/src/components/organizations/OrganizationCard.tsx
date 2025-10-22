import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, GitFork } from 'lucide-react';
import type { Organization } from '@/lib/types';

interface Props {
  organization: Organization;
}

export function OrganizationCard({ organization }: Props) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={organization.avatarUrl || undefined} />
            <AvatarFallback className="text-xl">
              {organization.displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <Link
              href={`/organizations/${organization.name}`}
              className="text-xl font-semibold hover:text-blue-600 transition-colors"
            >
              {organization.displayName}
            </Link>
            <p className="text-sm text-gray-600">@{organization.name}</p>
            {organization.description && (
              <p className="text-sm text-gray-700 mt-2 line-clamp-2">{organization.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <GitFork className="h-4 w-4" />
                <span>{organization.stats.repositories} repositories</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{organization.stats.members} members</span>
              </div>
            </div>
            {organization.location && (
              <Badge variant="outline" className="mt-2">
                📍 {organization.location}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
