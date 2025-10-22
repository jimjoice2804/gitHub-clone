'use client';

import { useEffect, useState } from 'react';
import type { OrganizationMember, OrgRole } from '@/lib/types';
import { organizationApi } from '@/lib/api/organization';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, UserPlus, UserMinus } from 'lucide-react';

interface Props {
  orgName: string;
  canManage: boolean;
}

export function MemberList({ orgName, canManage }: Props) {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingMember, setAddingMember] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<OrgRole>('MEMBER');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await organizationApi.getMembers(orgName);
      setMembers(data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgName]);

  const handleAddMember = async () => {
    if (!newUsername.trim()) {
      toast.error('Please enter a username');
      return;
    }
    try {
      setActionLoading('add');
      await organizationApi.addMember(orgName, newUsername, newRole);
      toast.success('Member added');
      setNewUsername('');
      setNewRole('MEMBER');
      setAddingMember(false);
      fetchMembers();
    } catch (error) {
      const e = error as { message?: string };
      toast.error(e?.message || 'Failed to add member');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (memberId: string, username: string) => {
    if (!confirm(`Remove ${username} from this organization?`)) return;
    try {
      setActionLoading(memberId);
      await organizationApi.removeMember(orgName, memberId);
      toast.success('Member removed');
      fetchMembers();
    } catch (error) {
      const e = error as { message?: string };
      toast.error(e?.message || 'Failed to remove member');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateRole = async (memberId: string, role: OrgRole) => {
    try {
      await organizationApi.updateMemberRole(orgName, memberId, role);
      toast.success('Role updated');
      fetchMembers();
    } catch (error) {
      const e = error as { message?: string };
      toast.error(e?.message || 'Failed to update role');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{members.length} members</h3>
          <Button onClick={() => setAddingMember(!addingMember)} size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Add member
          </Button>
        </div>
      )}

      {addingMember && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Enter username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="flex-1"
              />
              <Select value={newRole} onValueChange={(v) => setNewRole(v as OrgRole)}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="OWNER">Owner</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddMember} disabled={actionLoading === 'add'}>
                {actionLoading === 'add' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add
              </Button>
              <Button variant="outline" onClick={() => setAddingMember(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {members.map((member) => (
          <Card key={member.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.user.avatarUrl || undefined} />
                    <AvatarFallback>
                      {member.user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{member.user.name || member.user.username}</p>
                    <p className="text-sm text-gray-600">@{member.user.username}</p>
                    {member.user.bio && (
                      <p className="text-sm text-gray-500 mt-1">{member.user.bio}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canManage ? (
                    <>
                      <Select
                        value={member.role}
                        onValueChange={(v) => handleUpdateRole(member.id, v as OrgRole)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MEMBER">Member</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                          <SelectItem value="OWNER">Owner</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id, member.user.username)}
                        disabled={actionLoading === member.id}
                      >
                        {actionLoading === member.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserMinus className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  ) : (
                    <Badge>{member.role}</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
