'use client';

import { useState, useEffect } from 'react';
import { Issue, IssueState } from '@/lib/types';
import { issueApi } from '@/lib/api/issue';
import { IssueCard } from './IssueCard';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Loader2 } from 'lucide-react';
import { useDebounce } from '@/lib/hooks';

interface IssueListProps {
  owner: string;
  repo: string;
}

type SortOption = 'created' | 'updated' | 'comments';

export function IssueList({ owner, repo }: IssueListProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [state, setState] = useState<IssueState | 'ALL'>('OPEN');
  const [sort, setSort] = useState<SortOption>('created');
  const [total, setTotal] = useState(0);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        setLoading(true);
        const params = {
          state,
          search: debouncedSearch || undefined,
          sort,
          direction: 'desc' as const,
        };

        const response = await issueApi.getRepositoryIssues(owner, repo, params);

        setIssues(response.issues);
        setTotal(response.total);
      } catch (error) {
        console.error('Failed to fetch issues:', error);
        setIssues([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, [owner, repo, state, sort, debouncedSearch]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search issues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={state} onValueChange={(value) => setState(value as IssueState | 'ALL')}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created">Newest</SelectItem>
            <SelectItem value="updated">Recently updated</SelectItem>
            <SelectItem value="comments">Most commented</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {total} {state === 'ALL' ? '' : state.toLowerCase()} {total === 1 ? 'issue' : 'issues'}
        </span>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* Empty State */}
      {!loading && issues.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">
            {search ? 'No issues found matching your search.' : 'No issues yet.'}
          </p>
        </div>
      )}

      {/* Issue List */}
      {!loading && issues.length > 0 && (
        <div className="space-y-3">
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} owner={owner} repo={repo} />
          ))}
        </div>
      )}
    </div>
  );
}
