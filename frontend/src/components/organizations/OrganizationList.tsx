'use client';

import { useEffect, useState } from 'react';
import type { Organization } from '@/lib/types';
import { organizationApi } from '@/lib/api/organization';
import { OrganizationCard } from './OrganizationCard';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Search } from 'lucide-react';
import { useDebounce } from '@/lib/hooks';

type SortOption = 'created' | 'updated' | 'name' | 'members';

export function OrganizationList() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('created');
  const [total, setTotal] = useState(0);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const params = { search: debouncedSearch || undefined, sort, direction: 'desc' as const };
        const res = await organizationApi.getOrganizations(params);
        setOrgs(res.organizations);
        setTotal(res.total);
      } catch (error) {
        console.error('Failed to fetch organizations:', error);
        setOrgs([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [sort, debouncedSearch]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created">Newest</SelectItem>
            <SelectItem value="updated">Recently updated</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="members">Most members</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {total} {total === 1 ? 'organization' : 'organizations'}
        </span>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {!loading && orgs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">
            {search ? 'No organizations match your search.' : 'No organizations yet.'}
          </p>
        </div>
      )}

      {!loading && orgs.length > 0 && (
        <div className="space-y-3">
          {orgs.map((org) => (
            <OrganizationCard key={org.id} organization={org} />
          ))}
        </div>
      )}
    </div>
  );
}
