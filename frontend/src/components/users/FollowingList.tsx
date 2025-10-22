'use client';

import { useEffect, useState } from 'react';
import { userApi } from '@/lib/api/user';
import type { User } from '@/lib/types';
import { UserCard } from '@/components/users/UserCard';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/lib/hooks';

interface FollowingListProps {
  username: string;
}

export function FollowingList({ username }: FollowingListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page] = useState(1);
  const [limit] = useState(20);
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 300);

  useEffect(() => {
    const loadFollowing = async () => {
      try {
        setLoading(true);
        const res = await userApi.getFollowing(username, { page, limit });
        const data = res.data;
        setUsers(
          debounced
            ? data.filter(
                (u) =>
                  u.username.toLowerCase().includes(debounced.toLowerCase()) ||
                  (u.name || '').toLowerCase().includes(debounced.toLowerCase())
              )
            : data
        );
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    loadFollowing();
  }, [username, page, limit, debounced]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search following..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-gray-600 text-center py-8">Not following anyone</div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <UserCard key={u.id} user={u} />
          ))}
        </div>
      )}
    </div>
  );
}
