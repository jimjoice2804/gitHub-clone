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
import { issueApi } from '@/lib/api/issue';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  body: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CreateIssueDialogProps {
  owner: string;
  repo: string;
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export function CreateIssueDialog({ owner, repo, children, onSuccess }: CreateIssueDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const issue = await issueApi.createIssue(owner, repo, {
        title: data.title,
        body: data.body || undefined,
      });
      toast.success(`Issue #${issue.number} created successfully`);
      setOpen(false);
      reset();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/repositories/${owner}/${repo}/issues/${issue.number}`);
      }
    } catch (err) {
      const e = err as { message?: string };
      toast.error(e?.message || 'Failed to create issue');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children || <Button>New Issue</Button>}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create a new issue</DialogTitle>
          <DialogDescription>Report a bug, request a feature, or ask a question.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Brief description of the issue"
              {...register('title')}
              disabled={isSubmitting}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Description (optional)</Label>
            <Textarea
              id="body"
              placeholder="Provide details about the issue..."
              rows={8}
              {...register('body')}
              disabled={isSubmitting}
            />
            {errors.body && <p className="text-sm text-red-500">{errors.body.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create issue'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
