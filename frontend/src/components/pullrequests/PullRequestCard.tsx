import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CircleDot, CheckCircle2, GitMerge, MessageSquare } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/formatDate';
import type { PullRequest } from '@/lib/types/pullrequest';

interface PullRequestCardProps {
  pr: PullRequest;
  owner: string;
  repo: string;
}

export function PullRequestCard({ pr, owner, repo }: PullRequestCardProps) {
  const isOpen = pr.state === 'OPEN';
  const isMerged = pr.state === 'MERGED';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="mt-1">
            {isMerged ? (
              <GitMerge className="h-5 w-5 text-purple-600" />
            ) : isOpen ? (
              <CircleDot className="h-5 w-5 text-green-600" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-gray-500" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <Link
                  href={`/repositories/${owner}/${repo}/pulls/${pr.number}`}
                  className="text-lg font-semibold hover:text-blue-600 transition-colors"
                >
                  {pr.title}
                </Link>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>#{pr.number}</span>
                  <span>
                    {isMerged ? 'merged' : 'opened'} {formatRelativeTime(pr.createdAt)}
                  </span>
                  <span>by {pr.author.username}</span>
                  <span className="text-gray-400">from</span>
                  <span className="font-mono">{pr.headBranch}</span>
                  <span className="text-gray-400">into</span>
                  <span className="font-mono">{pr.baseBranch}</span>
                </div>
              </div>
              <Badge variant={isMerged ? 'secondary' : isOpen ? 'default' : 'secondary'}>
                {pr.state}
              </Badge>
            </div>

            <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
              {pr._count.comments > 0 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{pr._count.comments}</span>
                </div>
              )}
              {pr.assignees && pr.assignees.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs">Assigned:</span>
                  <div className="flex -space-x-2">
                    {pr.assignees.slice(0, 3).map((a) => (
                      <Avatar key={a.id} className="h-6 w-6 border-2 border-white">
                        <AvatarImage src={a.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {a.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  {pr.assignees.length > 3 && (
                    <span className="text-xs">+{pr.assignees.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
