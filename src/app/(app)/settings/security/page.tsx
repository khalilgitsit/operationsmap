'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { changePassword, changeEmail } from '@/server/actions/profile';

export default function SecurityPage() {
  // Password form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPwPending, startPwTransition] = useTransition();

  // Email form
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isEmailPending, startEmailTransition] = useTransition();

  function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    startPwTransition(async () => {
      const result = await changePassword(newPassword);
      if (result.success) {
        toast.success('Password updated successfully');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();

    if (!newEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (newEmail !== confirmEmail) {
      toast.error('Email addresses do not match');
      return;
    }

    startEmailTransition(async () => {
      const result = await changeEmail(newEmail);
      if (result.success) {
        toast.success('Confirmation email sent. Please check your inbox.');
        setNewEmail('');
        setConfirmEmail('');
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div>
      <PageHeader title="Security" backHref="/settings" backLabel="Settings" />
      <div className="max-w-2xl space-y-6">
        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password to keep your account secure.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={isPwPending || !newPassword || !confirmPassword}>
                {isPwPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Email */}
        <Card>
          <CardHeader>
            <CardTitle>Change Email</CardTitle>
            <CardDescription>
              A confirmation email will be sent to your new address. You must confirm it before the change takes effect.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-email">New Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter new email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-email">Confirm New Email</Label>
                <Input
                  id="confirm-email"
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder="Confirm new email address"
                />
              </div>
              <Button type="submit" disabled={isEmailPending || !newEmail || !confirmEmail}>
                {isEmailPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Email
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
