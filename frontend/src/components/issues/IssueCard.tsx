import Link from 'next/link';
import { Issue } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CircleDot, MessageSquare, CheckCircle2 } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/formatDate';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface IssueCardProps {
  issue: Issue;
  owner: string;
  repo: string;
}

export function IssueCard({ issue, owner, repo }: IssueCardProps) {
  const isOpen = issue.state === 'OPEN';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* Status Icon */}
          <div className="mt-1">
            {isOpen ? (
              <CircleDot className="h-5 w-5 text-green-600" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-purple-600" />
            )}
          </div>

          {/* Issue Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <Link
                  href={`/repositories/${owner}/${repo}/issues/${issue.number}`}
                  className="text-lg font-semibold hover:text-blue-600 transition-colors"
                >
                  {issue.title}
                </Link>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>#{issue.number}</span>
                  <span>opened {formatRelativeTime(issue.createdAt)}</span>
                  <span>by {issue.author.username}</span>
                </div>
              </div>

              {/* State Badge */}
              <Badge variant={isOpen ? 'default' : 'secondary'}>{issue.state}</Badge>
            </div>

            {/* Labels */}
            {issue.labels && issue.labels.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {issue.labels.map((label) => (
                  <Badge
                    key={label.id}
                    variant="outline"
                    style={{
                      backgroundColor: `${label.color}20`,
                      borderColor: label.color,
                      color: label.color,
                    }}
                  >
                    {label.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
              {issue._count.comments > 0 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{issue._count.comments}</span>
                </div>
              )}
              {issue.assignees && issue.assignees.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-xs">Assigned to:</span>
                  <div className="flex -space-x-2">
                    {issue.assignees.slice(0, 3).map((assignee) => (
                      <Avatar key={assignee.id} className="h-6 w-6 border-2 border-white">
                        <AvatarImage src={assignee.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {assignee.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  {issue.assignees.length > 3 && (
                    <span className="text-xs">+{issue.assignees.length - 3}</span>
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
