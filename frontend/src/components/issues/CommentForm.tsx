'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { issueApi } from '@/lib/api/issue';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const commentSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty').max(10000, 'Comment is too long'),
});

type CommentFormData = z.infer<typeof commentSchema>;

interface CommentFormProps {
  owner: string;
  repo: string;
  issueNumber: number;
  onSuccess?: () => void;
}

export function CommentForm({ owner, repo, issueNumber, onSuccess }: CommentFormProps) {
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
      await issueApi.addComment(owner, repo, issueNumber, data.body);
      toast.success('Comment added successfully');
      reset();
      onSuccess?.();
    } catch (error) {
      console.error('Failed to add comment:', error);
      const message = (error as { message?: string }).message || 'Failed to add comment';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Textarea
          {...register('body')}
          placeholder="Leave a comment..."
          rows={4}
          className="resize-none"
        />
        {errors.body && <p className="text-sm text-red-600 mt-1">{errors.body.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Comment
      </Button>
    </form>
  );
}
