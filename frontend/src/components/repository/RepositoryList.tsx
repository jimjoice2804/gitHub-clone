'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RepositoryCard } from './RepositoryCard';
import { repositoryApi, GetRepositoriesParams } from '@/lib/api/repository';
import { Repository } from '@/lib/types';
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function RepositoryList() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [visibility, setVisibility] = useState<'all' | 'public' | 'private'>('all');
  const [sort, setSort] = useState<'updated' | 'name' | 'created' | 'stars'>('updated');

  const fetchRepositories = async () => {
    try {
      setLoading(true);
      const params: GetRepositoriesParams = {
        search: search || undefined,
        visibility,
        sort,
        direction: 'desc',
      };
      const response = await repositoryApi.getRepositories(params);
      setRepositories(response.repositories);
    } catch (err) {
      const e = err as { message?: string };
      toast.error(e?.message || 'Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility, sort]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRepositories();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search repositories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <div className="flex gap-2">
        <Select
          value={visibility}
          onValueChange={(v) => setVisibility(v as 'all' | 'public' | 'private')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All repositories</SelectItem>
            <SelectItem value="public">Public only</SelectItem>
            <SelectItem value="private">Private only</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={sort}
          onValueChange={(v) => setSort(v as 'updated' | 'name' | 'created' | 'stars')}
        >
          <SelectTrigger className="w-[180px]">
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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : repositories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No repositories found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {repositories.map((repo) => (
            <RepositoryCard key={repo.id} repository={repo} />
          ))}
        </div>
      )}
    </div>
  );
}
