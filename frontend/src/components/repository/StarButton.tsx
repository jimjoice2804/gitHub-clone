'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { repositoryApi } from '@/lib/api/repository';
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  owner: string;
  repo: string;
  initialStarred: boolean;
  starsCount: number;
  onUpdate?: () => void;
}

export function StarButton({ owner, repo, initialStarred, starsCount, onUpdate }: Props) {
  const [isStarred, setIsStarred] = useState(initialStarred);
  const [count, setCount] = useState(starsCount);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    try {
      setLoading(true);
      if (isStarred) {
        await repositoryApi.unstarRepository(owner, repo);
        setIsStarred(false);
        setCount((prev) => Math.max(0, prev - 1));
        toast.success('Unstarred repository');
      } else {
        await repositoryApi.starRepository(owner, repo);
        setIsStarred(true);
        setCount((prev) => prev + 1);
        toast.success('Starred repository');
      }
      onUpdate?.();
    } catch (error) {
      const e = error as { message?: string };
      toast.error(e?.message || 'Failed to update star status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleToggle} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Star className={`mr-2 h-4 w-4 ${isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
      )}
      {isStarred ? 'Unstar' : 'Star'} {count}
    </Button>
  );
}
