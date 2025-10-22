import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/formatDate';
import type { Discussion } from '@/lib/types';

interface Props {
  discussion: Discussion;
  owner: string;
  repo: string;
}

export function DiscussionCard({ discussion, owner, repo }: Props) {
  const isLocked = discussion.state === 'LOCKED';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <Link
                  href={`/repositories/${owner}/${repo}/discussions/${discussion.number}`}
                  className="text-lg font-semibold hover:text-blue-600 transition-colors"
                >
                  {discussion.title}
                </Link>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>#{discussion.number}</span>
                  {discussion.category && (
                    <>
                      <span className="text-gray-400">in</span>
                      <Badge variant="outline">{discussion.category}</Badge>
                    </>
                  )}
                  <span>opened {formatRelativeTime(discussion.createdAt)}</span>
                  <span>by</span>
                  <div className="flex items-center gap-1">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={discussion.author.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {discussion.author.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{discussion.author.username}</span>
                  </div>
                </div>
              </div>
              <Badge variant={isLocked ? 'secondary' : 'default'}>{discussion.state}</Badge>
            </div>

            {discussion.tags && discussion.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {discussion.tags.map((t) => (
                  <Badge key={t.id} variant="outline">
                    {t.name}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
              {discussion._count.comments > 0 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{discussion._count.comments}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
