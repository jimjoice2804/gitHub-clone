'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { repositoryApi } from '@/lib/api/repository';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const schema = z.object({
  name: z
    .string()
    .min(1, 'Repository name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, hyphens, and underscores'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  isPrivate: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface CreateRepositoryDialogProps {
  children?: React.ReactNode;
}

export function CreateRepositoryDialog({ children }: CreateRepositoryDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      isPrivate: false,
    },
  });

  const isPrivate = watch('isPrivate');

  const onSubmit = async (data: FormData) => {
    try {
      const repo = await repositoryApi.createRepository({
        name: data.name,
        description: data.description || undefined,
        isPrivate: data.isPrivate,
      });
      toast.success(`Repository "${repo.name}" created successfully`);
      setOpen(false);
      reset();
      router.push(`/repositories/${repo.owner.username}/${repo.name}`);
    } catch (err) {
      const e = err as { message?: string };
      toast.error(e?.message || 'Failed to create repository');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children || <Button>New Repository</Button>}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create a new repository</DialogTitle>
          <DialogDescription>
            A repository contains all project files, including the revision history.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Repository name *</Label>
            <Input
              id="name"
              placeholder="my-awesome-project"
              {...register('name')}
              disabled={isSubmitting}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="A short description of your repository"
              rows={3}
              {...register('description')}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isPrivate">Private repository</Label>
              <p className="text-sm text-gray-500">
                {isPrivate ? 'Only you can see this repository' : 'Anyone can see this repository'}
              </p>
            </div>
            <Switch
              id="isPrivate"
              checked={isPrivate}
              onCheckedChange={(checked) => setValue('isPrivate', checked)}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create repository'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
