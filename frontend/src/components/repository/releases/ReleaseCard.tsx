import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Release } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Tag, Rocket, Calendar } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/formatDate';

interface ReleaseCardProps {
  release: Release;
}

export function ReleaseCard({ release }: ReleaseCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              {release.name || release.tagName}
            </CardTitle>
            <div className="mt-1 text-sm text-gray-600">{release.tagName}</div>
          </div>
          <div className="flex items-center gap-2">
            {release.prerelease && <Badge variant="secondary">Pre-release</Badge>}
            {release.draft && <Badge>Draft</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-700 whitespace-pre-wrap">
          {release.body || 'No description provided.'}
        </div>
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Rocket className="h-4 w-4" />
            {release.publishedAt
              ? `Published ${formatRelativeTime(release.publishedAt)}`
              : 'Not published'}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Created {formatRelativeTime(release.createdAt)} by {release.author.username}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
