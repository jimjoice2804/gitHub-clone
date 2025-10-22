'use client';

import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  UserPlus,
  AtSign,
  GitPullRequest,
  GitFork,
  Star,
  Eye,
  Users,
  FileText,
} from 'lucide-react';
import { Notification, NotificationType } from '@/lib/types';
import { formatRelativeTime } from '@/lib/utils/formatDate';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  issue_comment: <MessageSquare className="h-4 w-4" />,
  issue_assigned: <FileText className="h-4 w-4" />,
  issue_mention: <AtSign className="h-4 w-4" />,
  pull_request_comment: <MessageSquare className="h-4 w-4" />,
  pull_request_review: <GitPullRequest className="h-4 w-4" />,
  pull_request_assigned: <GitPullRequest className="h-4 w-4" />,
  pull_request_mention: <AtSign className="h-4 w-4" />,
  discussion_comment: <MessageSquare className="h-4 w-4" />,
  discussion_mention: <AtSign className="h-4 w-4" />,
  repository_invitation: <Users className="h-4 w-4" />,
  organization_invitation: <Users className="h-4 w-4" />,
  repository_star: <Star className="h-4 w-4" />,
  repository_fork: <GitFork className="h-4 w-4" />,
  repository_watch: <Eye className="h-4 w-4" />,
  follow: <UserPlus className="h-4 w-4" />,
};

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full flex items-start gap-3 p-4 text-left hover:bg-muted/50 transition-colors border-b',
        !notification.read && 'bg-blue-50/50'
      )}
    >
      <div className="shrink-0 mt-1">
        <div
          className={cn(
            'p-2 rounded-full',
            notification.read ? 'bg-muted' : 'bg-blue-100 text-blue-600'
          )}
        >
          {notificationIcons[notification.type]}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className={cn('text-sm font-medium', !notification.read && 'font-semibold')}>
            {notification.title}
          </h3>
          {!notification.read && (
            <div className="shrink-0 h-2 w-2 rounded-full bg-blue-600 mt-1.5" />
          )}
        </div>

        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>

        <p className="text-xs text-muted-foreground mt-2">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
    </button>
  );
}
