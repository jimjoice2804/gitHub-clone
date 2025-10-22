'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Organization } from '@/lib/types';
import { organizationApi } from '@/lib/api/organization';
import { useAuthStore } from '@/lib/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MemberList } from '@/components/organizations/MemberList';
import { Settings, Globe, Mail, MapPin, Users, GitFork, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function OrganizationDetailPage() {
  const params = useParams();
  const { user } = useAuthStore();
  const orgName = params.slug as string;

  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrg = async () => {
    try {
      setLoading(true);
      const data = await organizationApi.getOrganization(orgName);
      setOrg(data);
    } catch {
      toast.error('Failed to load organization');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrg();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Organization not found</p>
      </div>
    );
  }

  const isOwner = user?.id === org.owner.id;

  return (
    <div className="space-y-6">
      <Link href="/organizations">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to organizations
        </Button>
      </Link>

      {/* Org Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={org.avatarUrl || undefined} />
              <AvatarFallback className="text-2xl">
                {org.displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold">{org.displayName}</h1>
                  <p className="text-gray-600">@{org.name}</p>
                </div>
                {isOwner && (
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </Button>
                )}
              </div>
              {org.description && <p className="text-gray-700 mt-3">{org.description}</p>}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600">
                {org.website && (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-blue-600"
                  >
                    <Globe className="h-4 w-4" />
                    <span>{org.website}</span>
                  </a>
                )}
                {org.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{org.location}</span>
                  </div>
                )}
                {org.email && (
                  <a
                    href={`mailto:${org.email}`}
                    className="flex items-center gap-1 hover:text-blue-600"
                  >
                    <Mail className="h-4 w-4" />
                    <span>{org.email}</span>
                  </a>
                )}
              </div>
              <div className="flex items-center gap-4 mt-4">
                <Badge variant="outline" className="gap-1">
                  <GitFork className="h-3 w-3" />
                  {org.stats.repositories} repositories
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Users className="h-3 w-3" />
                  {org.stats.members} members
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="repositories">Repositories</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{org.description || 'No description provided.'}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="repositories">
          <Card>
            <CardHeader>
              <CardTitle>Repositories</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Organization repositories will be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <MemberList orgName={org.name} canManage={isOwner} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
