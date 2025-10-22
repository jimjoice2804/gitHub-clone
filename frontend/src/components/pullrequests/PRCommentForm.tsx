'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { pullRequestApi } from '@/lib/api/pullRequest';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const commentSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty').max(10000, 'Comment is too long'),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface PRCommentFormProps {
  owner: string;
  repo: string;
  number: number;
  onSuccess?: () => void;
}

export function PRCommentForm({ owner, repo, number, onSuccess }: PRCommentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  });

  const onSubmit = async (data: CommentFormData) => {
    try {
      setIsSubmitting(true);
      await pullRequestApi.addComment(owner, repo, number, data.body);
      toast.success('Comment added');
      reset();
      onSuccess?.();
    } catch (error) {
      const e = error as { message?: string };
      toast.error(e?.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Textarea
        rows={4}
        className="resize-none"
        placeholder="Leave a comment..."
        {...register('body')}
      />
      {errors.body && <p className="text-sm text-red-600">{errors.body.message}</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Comment
      </Button>
    </form>
  );
}
