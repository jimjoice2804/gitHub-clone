import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppLayout } from '@/components/layouts';
import { NotificationList } from '@/components/notifications/NotificationList';

export default function NotificationsPage() {
  return (
    <AuthGuard requireAuth={true}>
      <AppLayout>
        <NotificationList />
      </AppLayout>
    </AuthGuard>
  );
}
