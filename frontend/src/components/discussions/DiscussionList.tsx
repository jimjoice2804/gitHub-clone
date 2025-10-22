'use client';

import { useEffect, useState } from 'react';
import type { Discussion, DiscussionState } from '@/lib/types';
import { discussionApi } from '@/lib/api/discussion';
import { DiscussionCard } from './DiscussionCard';
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

interface Props {
  owner: string;
  repo: string;
}

type SortOption = 'created' | 'updated' | 'comments';

export function DiscussionList({ owner, repo }: Props) {
  const [items, setItems] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [state, setState] = useState<DiscussionState | 'ALL'>('OPEN');
  const [sort, setSort] = useState<SortOption>('created');
  const [total, setTotal] = useState(0);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const params = {
          state,
          search: debouncedSearch || undefined,
          sort,
          direction: 'desc' as const,
        };
        const res = await discussionApi.getRepositoryDiscussions(owner, repo, params);
        setItems(res.discussions);
        setTotal(res.total);
      } catch (error) {
        console.error('Failed to fetch discussions:', error);
        setItems([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [owner, repo, state, sort, debouncedSearch]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search discussions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={state} onValueChange={(v) => setState(v as DiscussionState | 'ALL')}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="LOCKED">Locked</SelectItem>
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
          {total === 1 ? 'discussion' : 'discussions'}
        </span>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">
            {search ? 'No discussions match your search.' : 'No discussions yet.'}
          </p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((d) => (
            <DiscussionCard key={d.id} discussion={d} owner={owner} repo={repo} />
          ))}
        </div>
      )}
    </div>
  );
}
