'use client';

import { useEffect, useState } from 'react';
import type { PullRequest, PullRequestState } from '@/lib/types/pullrequest';
import { pullRequestApi } from '@/lib/api/pullRequest';
import { PullRequestCard } from './PullRequestCard';
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

interface PullRequestListProps {
  owner: string;
  repo: string;
}

type SortOption = 'created' | 'updated' | 'comments';

export function PullRequestList({ owner, repo }: PullRequestListProps) {
  const [pulls, setPulls] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [state, setState] = useState<PullRequestState | 'ALL'>('OPEN');
  const [sort, setSort] = useState<SortOption>('created');
  const [total, setTotal] = useState(0);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    const fetchPulls = async () => {
      try {
        setLoading(true);
        const params = {
          state,
          search: debouncedSearch || undefined,
          sort,
          direction: 'desc' as const,
        };

        const response = await pullRequestApi.getRepositoryPullRequests(owner, repo, params);
        setPulls(response.pullRequests);
        setTotal(response.total);
      } catch (error) {
        console.error('Failed to fetch pull requests:', error);
        setPulls([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchPulls();
  }, [owner, repo, state, sort, debouncedSearch]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search pull requests..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={state} onValueChange={(v) => setState(v as PullRequestState | 'ALL')}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
            <SelectItem value="MERGED">Merged</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created">Newest</SelectItem>
            <SelectItem value="updated">Recently updated</SelectItem>
            <SelectItem value="comments">Most commented</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {total} {state === 'ALL' ? '' : state.toLowerCase()}{' '}
          {total === 1 ? 'pull request' : 'pull requests'}
        </span>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {!loading && pulls.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">
            {search ? 'No pull requests match your search.' : 'No pull requests yet.'}
          </p>
        </div>
      )}

      {!loading && pulls.length > 0 && (
        <div className="space-y-3">
          {pulls.map((pr) => (
            <PullRequestCard key={pr.id} pr={pr} owner={owner} repo={repo} />
          ))}
        </div>
      )}
    </div>
  );
}
