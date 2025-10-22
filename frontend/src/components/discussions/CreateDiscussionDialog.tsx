'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { discussionApi } from '@/lib/api/discussion';
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
  category: z.string().optional(),
});

type CreateDiscussionForm = z.infer<typeof schema>;

interface Props {
  owner: string;
  repo: string;
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export function CreateDiscussionDialog({ owner, repo, children, onSuccess }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateDiscussionForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: CreateDiscussionForm) => {
    try {
      setIsSubmitting(true);
      const discussion = await discussionApi.createDiscussion(owner, repo, values);
      toast.success('Discussion created');
      setOpen(false);
      reset();
      if (onSuccess) onSuccess();
      else router.push(`/repositories/${owner}/${repo}/discussions/${discussion.number}`);
    } catch (error) {
      const e = error as { message?: string };
      toast.error(e?.message || 'Failed to create discussion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children ?? <Button>New discussion</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a discussion</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <Input placeholder="What's on your mind?" {...register('title')} />
            {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Category (optional)</label>
            <Input placeholder="e.g. Q&A, Ideas, General" {...register('category')} />
            {errors.category && (
              <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">Body</label>
            <Textarea placeholder="Write something..." rows={6} {...register('body')} />
            {errors.body && <p className="text-sm text-red-600 mt-1">{errors.body.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
