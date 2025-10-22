'use client';

import { useState } from 'react';
import { IssueComment } from '@/lib/types';
import { issueApi } from '@/lib/api/issue';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatRelativeTime } from '@/lib/utils/formatDate';
import { useAuthStore } from '@/lib/stores/authStore';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CommentListProps {
  owner: string;
  repo: string;
  issueNumber: number;
  comments: IssueComment[];
  onUpdate?: () => void;
}

export function CommentList({ owner, repo, issueNumber, comments, onUpdate }: CommentListProps) {
  const { user } = useAuthStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEdit = (comment: IssueComment) => {
    setEditingId(comment.id);
    setEditBody(comment.body);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditBody('');
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editBody.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      setIsUpdating(true);
      await issueApi.updateComment(owner, repo, issueNumber, commentId, editBody);
      toast.success('Comment updated successfully');
      setEditingId(null);
      setEditBody('');
      onUpdate?.();
    } catch (error) {
      console.error('Failed to update comment:', error);
      const message = (error as { message?: string }).message || 'Failed to update comment';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      setIsDeleting(commentId);
      await issueApi.deleteComment(owner, repo, issueNumber, commentId);
      toast.success('Comment deleted successfully');
      onUpdate?.();
    } catch (error) {
      console.error('Failed to delete comment:', error);
      const message = (error as { message?: string }).message || 'Failed to delete comment';
      toast.error(message);
    } finally {
      setIsDeleting(null);
    }
  };

  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        No comments yet. Be the first to comment!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const isOwner = user?.id === comment.authorId;
        const isEditing = editingId === comment.id;

        return (
          <Card key={comment.id}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={comment.author.avatarUrl || undefined} />
                  <AvatarFallback>
                    {comment.author.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{comment.author.username}</span>
                      <span className="text-sm text-gray-600">
                        commented {formatRelativeTime(comment.createdAt)}
                      </span>
                      {comment.updatedAt !== comment.createdAt && (
                        <span className="text-sm text-gray-500">(edited)</span>
                      )}
                    </div>

                    {isOwner && !isEditing && (
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(comment)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(comment.id)}
                          disabled={isDeleting === comment.id}
                        >
                          {isDeleting === comment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(comment.id)}
                          disabled={isUpdating}
                        >
                          {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={isUpdating}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-wrap text-gray-700">{comment.body}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
