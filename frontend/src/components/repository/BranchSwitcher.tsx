'use client';

import { useEffect, useState } from 'react';
import { repositoryApi } from '@/lib/api/repository';
import type { Branch } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { GitBranch, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BranchSwitcherProps {
  owner: string;
  repo: string;
  current: string;
  canManage?: boolean;
  onChange?: (branch: string) => void;
}

export function BranchSwitcher({ owner, repo, current, canManage, onChange }: BranchSwitcherProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selected, setSelected] = useState(current);
  const [creating, setCreating] = useState(false);
  const [newBranch, setNewBranch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const list = await repositoryApi.getBranches(owner, repo);
        setBranches(list);
      } catch {
        setBranches([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [owner, repo]);

  const handleCreate = async () => {
    if (!newBranch.trim()) return;
    try {
      setCreating(true);
      const b = await repositoryApi.createBranch(owner, repo, {
        name: newBranch.trim(),
        from: selected,
      });
      setBranches((prev) => [b, ...prev]);
      setSelected(b.name);
      onChange?.(b.name);
      setNewBranch('');
      toast.success(`Branch ${b.name} created`);
    } catch {
      toast.error('Failed to create branch');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <GitBranch className="h-5 w-5" />
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      ) : (
        <Select
          value={selected}
          onValueChange={(v) => {
            setSelected(v);
            onChange?.(v);
          }}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select branch" />
          </SelectTrigger>
          <SelectContent>
            {branches.map((b) => (
              <SelectItem key={b.name} value={b.name}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {canManage && (
        <div className="flex items-center gap-2">
          <Input
            placeholder="New branch name"
            value={newBranch}
            onChange={(e) => setNewBranch(e.target.value)}
            className="w-48"
          />
          <Button size="sm" onClick={handleCreate} disabled={creating || !newBranch.trim()}>
            {creating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Create
          </Button>
        </div>
      )}
    </div>
  );
}
