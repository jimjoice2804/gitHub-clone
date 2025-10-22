'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { repositoryApi } from '@/lib/api/repository';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  owner: string;
  repo: string;
  initialWatching: boolean;
  watchersCount: number;
  onUpdate?: () => void;
}

export function WatchButton({ owner, repo, initialWatching, watchersCount, onUpdate }: Props) {
  const [isWatching, setIsWatching] = useState(initialWatching);
  const [count, setCount] = useState(watchersCount);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    try {
      setLoading(true);
      if (isWatching) {
        await repositoryApi.unwatchRepository(owner, repo);
        setIsWatching(false);
        setCount((prev) => Math.max(0, prev - 1));
        toast.success('Unwatched repository');
      } else {
        await repositoryApi.watchRepository(owner, repo);
        setIsWatching(true);
        setCount((prev) => prev + 1);
        toast.success('Watching repository');
      }
      onUpdate?.();
    } catch (error) {
      const e = error as { message?: string };
      toast.error(e?.message || 'Failed to update watch status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleToggle} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : isWatching ? (
        <EyeOff className="mr-2 h-4 w-4" />
      ) : (
        <Eye className="mr-2 h-4 w-4" />
      )}
      {isWatching ? 'Unwatch' : 'Watch'} {count}
    </Button>
  );
}
