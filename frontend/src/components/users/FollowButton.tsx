'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { userApi } from '@/lib/api/user';
import { Loader2, UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';

interface FollowButtonProps {
  username: string;
  initialFollowing?: boolean;
  onChange?: (following: boolean) => void;
}

export function FollowButton({ username, initialFollowing, onChange }: FollowButtonProps) {
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState<boolean>(initialFollowing ?? false);
  const [initialized, setInitialized] = useState<boolean>(initialFollowing !== undefined);

  useEffect(() => {
    let mounted = true;
    const loadStatus = async () => {
      if (initialized) return;
      try {
        const res = await userApi.isFollowing(username);
        if (!mounted) return;
        setIsFollowing(res.following);
        setInitialized(true);
      } catch {
        // Silently ignore; button will default to not following
        setInitialized(true);
      }
    };
    loadStatus();
    return () => {
      mounted = false;
    };
  }, [username, initialized]);

  const toggleFollow = async () => {
    try {
      setLoading(true);
      if (isFollowing) {
        await userApi.unfollowUser(username);
        setIsFollowing(false);
        onChange?.(false);
        toast.success(`Unfollowed @${username}`);
      } else {
        await userApi.followUser(username);
        setIsFollowing(true);
        onChange?.(true);
        toast.success(`Now following @${username}`);
      }
    } catch {
      toast.error('Failed to update follow status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={isFollowing ? 'secondary' : 'default'}
      size="sm"
      onClick={toggleFollow}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : isFollowing ? (
        <UserMinus className="h-4 w-4 mr-2" />
      ) : (
        <UserPlus className="h-4 w-4 mr-2" />
      )}
      {isFollowing ? 'Unfollow' : 'Follow'}
    </Button>
  );
}
