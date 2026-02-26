'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Loader2, Trash2, Shield, User } from 'lucide-react';
import {
  listOrgUsers,
  inviteUser,
  changeUserRole,
  removeUser,
  type OrgUser,
} from '@/server/actions/settings';

export default function UserManagementPage() {
  const [isPending, startTransition] = useTransition();
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [removeTarget, setRemoveTarget] = useState<OrgUser | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const result = await listOrgUsers();
    if (result.success) setUsers(result.data);
    else toast.error(result.error);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function handleInvite() {
    if (!inviteEmail.trim()) return;
    startTransition(async () => {
      const result = await inviteUser(inviteEmail.trim());
      if (result.success) {
        toast.success(`User ${inviteEmail} invited`);
        setShowInvite(false);
        setInviteEmail('');
        loadUsers();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleRoleChange(userId: string, newRole: 'admin' | 'member') {
    startTransition(async () => {
      const result = await changeUserRole(userId, newRole);
      if (result.success) {
        toast.success('Role updated');
        loadUsers();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleRemove(user: OrgUser) {
    startTransition(async () => {
      const result = await removeUser(user.userId);
      if (result.success) {
        toast.success(`${user.email} removed`);
        setRemoveTarget(null);
        loadUsers();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="User Management" backHref="/settings" backLabel="Settings" />

      <div className="space-y-4 mt-4">
        {/* Invite section */}
        {showInvite ? (
          <div className="rounded-md border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Input
                type="email"
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              />
              <Button size="sm" onClick={handleInvite} disabled={isPending || !inviteEmail.trim()}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Invite'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowInvite(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setShowInvite(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Invite User
          </Button>
        )}

        {/* Users list */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No users found.</p>
        ) : (
          <div className="rounded-md border divide-y">
            {users.map((user) => (
              <div key={user.userId} className="flex items-center gap-3 p-4">
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  {user.role === 'admin' ? (
                    <Shield className="h-4 w-4 text-primary" />
                  ) : (
                    <User className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Select
                  value={user.role}
                  onValueChange={(v) => handleRoleChange(user.userId, v as 'admin' | 'member')}
                >
                  <SelectTrigger className="w-[120px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => setRemoveTarget(user)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Remove confirmation */}
      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {removeTarget?.email} from this workspace?
              They will lose access to all data in this workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => removeTarget && handleRemove(removeTarget)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
