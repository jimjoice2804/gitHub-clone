'use client';

import { useEffect, useState } from 'react';
import { repositoryApi } from '@/lib/api/repository';
import type { Release } from '@/lib/types';
import { ReleaseCard } from '@/components/repository/releases/ReleaseCard';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReleaseListProps {
  owner: string;
  repo: string;
}

export function ReleaseList({ owner, repo }: ReleaseListProps) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const list = await repositoryApi.getReleases(owner, repo);
      setReleases(list);
    } catch {
      toast.error('Failed to load releases');
      setReleases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner, repo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!loading && releases.length === 0) {
    return <div className="text-gray-600 text-sm">No releases yet.</div>;
  }

  return (
    <div className="space-y-4">
      {releases.map((rel) => (
        <ReleaseCard key={rel.id} release={rel} />
      ))}
    </div>
  );
}
