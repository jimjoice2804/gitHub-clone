'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppLayout } from '@/components/layouts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RepositoryCard } from '@/components/repository/RepositoryCard';
import { UserCard } from '@/components/users/UserCard';
import { searchApi } from '@/lib/api/search';
import type { Repository, User } from '@/lib/types';
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState('repositories');
  const [loading, setLoading] = useState(false);

  // Repository results
  const [repos, setRepos] = useState<Repository[]>([]);
  const [reposTotal, setReposTotal] = useState(0);
  const [repoSort, setRepoSort] = useState<'relevance' | 'created' | 'updated' | 'stars'>(
    'relevance'
  );

  // User results
  const [users, setUsers] = useState<User[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [userSort, setUserSort] = useState<'relevance' | 'created' | 'updated'>('relevance');

  // Search repositories
  const searchRepositories = async () => {
    if (!query.trim()) return;
    try {
      setLoading(true);
      const res = await searchApi.searchRepositories({
        query: query.trim(),
        sort: repoSort,
        order: 'desc',
      });
      setRepos(res.items);
      setReposTotal(res.total);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Failed to search repositories');
    } finally {
      setLoading(false);
    }
  };

  // Search users
  const searchUsers = async () => {
    if (!query.trim()) return;
    try {
      setLoading(true);
      const res = await searchApi.searchUsers({
        query: query.trim(),
        sort: userSort,
        order: 'desc',
      });
      setUsers(res.items);
      setUsersTotal(res.total);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  // Initial search on mount if query exists
  useEffect(() => {
    if (initialQuery) {
      searchRepositories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search when tab changes
  useEffect(() => {
    if (!query.trim()) return;

    switch (activeTab) {
      case 'repositories':
        searchRepositories();
        break;
      case 'users':
        searchUsers();
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, repoSort, userSort]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    switch (activeTab) {
      case 'repositories':
        searchRepositories();
        break;
      case 'users':
        searchUsers();
        break;
    }
  };

  return (
    <AuthGuard requireAuth={true}>
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Search</h1>
            <p className="text-gray-600 mt-1">
              Find repositories, users, issues, and pull requests
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </form>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="repositories">
                Repositories
                {reposTotal > 0 && (
                  <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                    {reposTotal}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="users">
                Users
                {usersTotal > 0 && (
                  <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                    {usersTotal}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Repositories Tab */}
            <TabsContent value="repositories" className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {reposTotal} {reposTotal === 1 ? 'repository' : 'repositories'}
                </div>
                <Select value={repoSort} onValueChange={(v) => setRepoSort(v as typeof repoSort)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Best match</SelectItem>
                    <SelectItem value="stars">Most stars</SelectItem>
                    <SelectItem value="updated">Recently updated</SelectItem>
                    <SelectItem value="created">Recently created</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              )}

              {!loading && repos.length === 0 && query && (
                <div className="text-center py-12">
                  <p className="text-gray-600">No repositories found</p>
                </div>
              )}

              {!loading && repos.length > 0 && (
                <div className="space-y-4">
                  {repos.map((repo) => (
                    <RepositoryCard key={repo.id} repository={repo} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {usersTotal} {usersTotal === 1 ? 'user' : 'users'}
                </div>
                <Select value={userSort} onValueChange={(v) => setUserSort(v as typeof userSort)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Best match</SelectItem>
                    <SelectItem value="updated">Recently active</SelectItem>
                    <SelectItem value="created">Recently joined</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              )}

              {!loading && users.length === 0 && query && (
                <div className="text-center py-12">
                  <p className="text-gray-600">No users found</p>
                </div>
              )}

              {!loading && users.length > 0 && (
                <div className="space-y-4">
                  {users.map((user) => (
                    <UserCard key={user.id} user={user} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <AuthGuard requireAuth={true}>
          <AppLayout>
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          </AppLayout>
        </AuthGuard>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
