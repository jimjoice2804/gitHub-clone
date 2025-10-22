'use client';

import { useState } from 'react';
import { repositoryApi } from '@/lib/api/repository';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface CreateReleaseDialogProps {
  owner: string;
  repo: string;
  onCreated?: () => void;
  children: React.ReactNode;
}

export function CreateReleaseDialog({
  owner,
  repo,
  onCreated,
  children,
}: CreateReleaseDialogProps) {
  const [open, setOpen] = useState(false);
  const [tagName, setTagName] = useState('');
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [draft, setDraft] = useState(false);
  const [prerelease, setPrerelease] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!tagName.trim()) {
      toast.error('Tag name is required');
      return;
    }
    try {
      setLoading(true);
      await repositoryApi.createRelease(owner, repo, {
        tagName: tagName.trim(),
        name: name.trim() || undefined,
        body: body.trim() || undefined,
        draft,
        prerelease,
      });
      toast.success('Release created');
      setOpen(false);
      setTagName('');
      setName('');
      setBody('');
      setDraft(false);
      setPrerelease(false);
      onCreated?.();
    } catch {
      toast.error('Failed to create release');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" /> New release
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Tag (e.g., v1.0.0)"
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
          />
          <Input
            placeholder="Release title (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Textarea
            placeholder="Description (Markdown supported)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={draft}
                onCheckedChange={(v: boolean) => setDraft(v)}
                id="draft-switch"
              />
              <Label htmlFor="draft-switch">Draft</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={prerelease}
                onCheckedChange={(v: boolean) => setPrerelease(v)}
                id="pre-switch"
              />
              <Label htmlFor="pre-switch">Pre-release</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Create release
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
