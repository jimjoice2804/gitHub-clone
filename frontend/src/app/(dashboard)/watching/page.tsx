'use client';

import { useEffect, useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppLayout } from '@/components/layouts';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RepositoryCard } from '@/components/repository/RepositoryCard';
import { repositoryApi } from '@/lib/api/repository';
import type { Repository } from '@/lib/types';
import { Search, Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useDebounce } from '@/lib/hooks';

export default function WatchingPage() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'updated' | 'name' | 'created' | 'stars'>('updated');
  const [total, setTotal] = useState(0);

  const debouncedSearch = useDebounce(search, 300);

  const fetchWatchedRepos = async () => {
    try {
      setLoading(true);
      const params = {
        search: debouncedSearch || undefined,
        sort,
        direction: 'desc' as const,
      };
      const res = await repositoryApi.getWatchedRepositories(params);
      setRepos(res.repositories);
      setTotal(res.total);
    } catch (error) {
      console.error('Failed to fetch watched repositories:', error);
      toast.error('Failed to load watched repositories');
      setRepos([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchedRepos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, debouncedSearch]);

  return (
    <AuthGuard requireAuth={true}>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Eye className="h-8 w-8 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold">Watching</h1>
              <p className="text-gray-600 mt-1">Repositories you&apos;re watching</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search watched repositories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Recently updated</SelectItem>
                <SelectItem value="created">Recently created</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="stars">Most stars</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-gray-600">
            {total} {total === 1 ? 'repository' : 'repositories'}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          )}

          {!loading && repos.length === 0 && (
            <div className="text-center py-12">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {search
                  ? 'No repositories match your search.'
                  : 'You&apos;re not watching any repositories yet.'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Watch repositories to get notified about new activity.
              </p>
            </div>
          )}

          {!loading && repos.length > 0 && (
            <div className="space-y-4">
              {repos.map((repo) => (
                <RepositoryCard key={repo.id} repository={repo} />
              ))}
            </div>
          )}
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
