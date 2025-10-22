'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pullRequestApi } from '@/lib/api/pullRequest';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  body: z.string().optional(),
  baseBranch: z.string().min(1, 'Base branch is required'),
  headBranch: z.string().min(1, 'Compare branch is required'),
});

export type CreatePullRequestForm = z.infer<typeof schema>;

interface CreatePullRequestDialogProps {
  owner: string;
  repo: string;
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export function CreatePullRequestDialog({
  owner,
  repo,
  children,
  onSuccess,
}: CreatePullRequestDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePullRequestForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: CreatePullRequestForm) => {
    try {
      setIsSubmitting(true);
      const pr = await pullRequestApi.createPullRequest(owner, repo, values);
      toast.success(`Pull request #${pr.number} created`);
      setOpen(false);
      reset();
      if (onSuccess) onSuccess();
      else router.push(`/repositories/${owner}/${repo}/pulls/${pr.number}`);
    } catch (error) {
      const e = error as { message?: string };
      toast.error(e?.message || 'Failed to create pull request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children ?? <Button>Create pull request</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open a pull request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input placeholder="Give your pull request a title" {...register('title')} />
            {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea placeholder="Describe the changes" rows={6} {...register('body')} />
            {errors.body && <p className="text-sm text-red-600 mt-1">{errors.body.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Base branch</label>
              <Input placeholder="e.g. main" {...register('baseBranch')} />
              {errors.baseBranch && (
                <p className="text-sm text-red-600 mt-1">{errors.baseBranch.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Compare branch</label>
              <Input placeholder="e.g. feature/login" {...register('headBranch')} />
              {errors.headBranch && (
                <p className="text-sm text-red-600 mt-1">{errors.headBranch.message}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create pull request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
