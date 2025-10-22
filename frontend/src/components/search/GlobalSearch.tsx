'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { searchApi } from '@/lib/api/search';
import type { QuickSearchResult } from '@/lib/types';
import { Search, Loader2, FolderGit2, User, Command } from 'lucide-react';
import { useDebounce } from '@/lib/hooks';

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QuickSearchResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const debouncedQuery = useDebounce(query, 300);

  // Quick search on debounced query
  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults(null);
        setIsOpen(false);
        return;
      }

      try {
        setLoading(true);
        const data = await searchApi.quickSearch(debouncedQuery);
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error('Search failed:', error);
        setResults(null);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsFocused(true);
      }

      // ESC to close
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsFocused(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleResultClick = () => {
    setIsOpen(false);
    setIsFocused(false);
    setQuery('');
  };

  const showResults =
    isOpen && results && (results.repositories.length > 0 || results.users.length > 0);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search repositories, users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              if (results) setIsOpen(true);
            }}
            className="pl-9 pr-20 bg-gray-50 border-gray-200 focus:bg-white"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
            {!isFocused && (
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded">
                <Command className="h-3 w-3" />K
              </kbd>
            )}
          </div>
        </div>
      </form>

      {/* Quick Results Dropdown */}
      {showResults && (
        <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto z-50 shadow-lg">
          <div className="p-2 space-y-2">
            {/* Repositories */}
            {results.repositories.length > 0 && (
              <div>
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                  Repositories
                </div>
                <div className="space-y-1">
                  {results.repositories.map((repo) => (
                    <button
                      key={repo.id}
                      onClick={() => {
                        router.push(`/repositories/${repo.owner.username}/${repo.name}`);
                        handleResultClick();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 text-left transition-colors"
                    >
                      <FolderGit2 className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {repo.owner.username}/{repo.name}
                        </div>
                        {repo.description && (
                          <div className="text-xs text-gray-500 truncate">{repo.description}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Users */}
            {results.users.length > 0 && (
              <div>
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">Users</div>
                <div className="space-y-1">
                  {results.users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        router.push(`/profile/${user.username}`);
                        handleResultClick();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-100 text-left transition-colors"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatarUrl || undefined} alt={user.username} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {user.name || user.username}
                        </div>
                        <div className="text-xs text-gray-500 truncate">@{user.username}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* View All Results Link */}
            {results.total > 0 && (
              <div className="border-t pt-2">
                <button
                  onClick={() => {
                    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                    handleResultClick();
                  }}
                  className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors text-center"
                >
                  View all {results.total} results
                </button>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
