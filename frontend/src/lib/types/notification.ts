export type NotificationType =
    | 'issue_comment'
    | 'issue_assigned'
    | 'issue_mention'
    | 'pull_request_comment'
    | 'pull_request_review'
    | 'pull_request_assigned'
    | 'pull_request_mention'
    | 'discussion_comment'
    | 'discussion_mention'
    | 'repository_invitation'
    | 'organization_invitation'
    | 'repository_star'
    | 'repository_fork'
    | 'repository_watch'
    | 'follow';

export interface Notification {
    id: number;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    link?: string;
    repositoryId?: number;
    issueId?: number;
    pullRequestId?: number;
    discussionId?: number;
    organizationId?: number;
    userId?: number;
    createdAt: string;
    updatedAt: string;
}

export interface NotificationFilters {
    read?: boolean;
    type?: NotificationType;
    search?: string;
    page?: number;
    limit?: number;
}

export interface NotificationsResponse {
    notifications: Notification[];
    total: number;
    unreadCount: number;
    page: number;
    limit: number;
}
