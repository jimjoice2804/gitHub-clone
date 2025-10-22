import Link from 'next/link';
import { Repository } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, GitFork, Eye, Lock, Globe } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/formatDate';

interface RepositoryCardProps {
  repository: Repository;
}

export function RepositoryCard({ repository }: RepositoryCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg">
              <Link
                href={`/repositories/${repository.owner.username}/${repository.name}`}
                className="hover:text-blue-600 transition-colors"
              >
                {repository.owner.username}/{repository.name}
              </Link>
            </CardTitle>
            {repository.description && (
              <CardDescription className="line-clamp-2">{repository.description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            {repository.isPrivate ? (
              <Badge variant="secondary" className="gap-1">
                <Lock className="h-3 w-3" />
                Private
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <Globe className="h-3 w-3" />
                Public
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {repository.language && (
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-blue-500"></span>
              <span>{repository.language}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4" />
            <span>{repository.starsCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <GitFork className="h-4 w-4" />
            <span>{repository.forksCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{repository.watchersCount}</span>
          </div>
          <div className="ml-auto text-xs text-gray-500">
            Updated {formatRelativeTime(repository.updatedAt)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
