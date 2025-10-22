'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { userApi } from '@/lib/api/user';
import { useAuthStore } from '@/lib/stores/authStore';
import { toast } from 'sonner';

export function AvatarUploader() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { user, setUser } = useAuthStore();
  const [isUploading, setUploading] = useState(false);

  const initials = (user?.name || user?.username || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const updated = await userApi.uploadAvatar(file);
      setUser(updated);
      toast.success('Avatar updated');
    } catch (err) {
      const e = err as { message?: string };
      toast.error(e?.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20">
        <AvatarImage src={user?.avatarUrl || undefined} alt={user?.username || ''} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="space-x-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />
        <Button onClick={() => inputRef.current?.click()} disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Change Avatar'}
        </Button>
      </div>
    </div>
  );
}
