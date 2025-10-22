'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { userApi } from '@/lib/api/user';
import { useAuthStore } from '@/lib/stores/authStore';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').nullable().optional(),
  bio: z.string().max(280, 'Bio cannot exceed 280 characters').nullable().optional(),
  location: z.string().nullable().optional(),
  website: z.string().url('Invalid URL').nullable().optional(),
  company: z.string().nullable().optional(),
});

type FormData = z.infer<typeof schema>;

export function EditProfileForm() {
  const { user, setUser } = useAuthStore();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? '',
      bio: user?.bio ?? '',
      location: user?.location ?? '',
      website: user?.website ?? '',
      company: user?.company ?? '',
    },
  });

  const onSubmit = async (data: FormData) => {
    const payload = {
      name: data.name ?? null,
      bio: data.bio ?? null,
      location: data.location ?? null,
      website: data.website ?? null,
      company: data.company ?? null,
    };

    const updated = await userApi.updateProfile(payload);
    setUser(updated);
    toast.success('Profile updated');
    reset({
      name: updated.name ?? '',
      bio: updated.bio ?? '',
      location: updated.location ?? '',
      website: updated.website ?? '',
      company: updated.company ?? '',
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input id="company" {...register('company')} />
          {errors.company && <p className="text-sm text-red-500">{errors.company.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" rows={4} {...register('bio')} />
        {errors.bio && <p className="text-sm text-red-500">{errors.bio.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" {...register('location')} />
          {errors.location && <p className="text-sm text-red-500">{errors.location.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input id="website" placeholder="https://example.com" {...register('website')} />
          {errors.website && <p className="text-sm text-red-500">{errors.website.message}</p>}
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
