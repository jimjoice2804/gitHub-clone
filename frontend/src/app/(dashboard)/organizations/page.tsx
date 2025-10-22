'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { OrganizationList } from '@/components/organizations/OrganizationList';
import { CreateOrganizationDialog } from '@/components/organizations/CreateOrganizationDialog';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export default function OrganizationsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <AuthGuard requireAuth={true}>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Organizations</h1>
              <p className="text-gray-600 mt-1">Manage your organizations</p>
            </div>
            <CreateOrganizationDialog onSuccess={() => setRefreshKey(refreshKey + 1)}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Organization
              </Button>
            </CreateOrganizationDialog>
          </div>

          <OrganizationList key={refreshKey} />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
