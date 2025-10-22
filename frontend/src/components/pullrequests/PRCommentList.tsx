'use client';

import { useState } from 'react';
import type { PullRequestComment } from '@/lib/types/pullrequest';
import { pullRequestApi } from '@/lib/api/pullRequest';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatRelativeTime } from '@/lib/utils/formatDate';
import { useAuthStore } from '@/lib/stores/authStore';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PRCommentListProps {
  owner: string;
  repo: string;
  number: number;
  comments: PullRequestComment[];
  onUpdate?: () => void;
}

export function PRCommentList({ owner, repo, number, comments, onUpdate }: PRCommentListProps) {
  const { user } = useAuthStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEdit = (c: PullRequestComment) => {
    setEditingId(c.id);
    setEditBody(c.body);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditBody('');
  };

  const handleSave = async (commentId: string) => {
    if (!editBody.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    try {
      setIsUpdating(true);
      await pullRequestApi.updateComment(owner, repo, number, commentId, editBody);
      toast.success('Comment updated');
      setEditingId(null);
      setEditBody('');
      onUpdate?.();
    } catch (error) {
      const e = error as { message?: string };
      toast.error(e?.message || 'Failed to update comment');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      setIsDeleting(commentId);
      await pullRequestApi.deleteComment(owner, repo, number, commentId);
      toast.success('Comment deleted');
      onUpdate?.();
    } catch (error) {
      const e = error as { message?: string };
      toast.error(e?.message || 'Failed to delete comment');
    } finally {
      setIsDeleting(null);
    }
  };

  if (comments.length === 0) {
    return <div className="text-center py-8 text-gray-600">No comments yet.</div>;
  }

  return (
    <div className="space-y-4">
      {comments.map((c) => {
        const isOwner = user?.id === c.authorId;
        const isEditing = editingId === c.id;
        return (
          <Card key={c.id}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={c.author.avatarUrl || undefined} />
                  <AvatarFallback>{c.author.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-semibold text-gray-900">{c.author.username}</span>
                      <span>commented {formatRelativeTime(c.createdAt)}</span>
                      {c.updatedAt !== c.createdAt && (
                        <span className="text-gray-500">(edited)</span>
                      )}
                    </div>
                    {isOwner && !isEditing && (
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(c.id)}
                          disabled={isDeleting === c.id}
                        >
                          {isDeleting === c.id ? (
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
                        rows={4}
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSave(c.id)} disabled={isUpdating}>
                          {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancel}
                          disabled={isUpdating}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-gray-700">{c.body}</p>
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
