'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createWorkspace } from '@/server/actions/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      const result = await createWorkspace(name.trim());
      if (result.success) {
        // Set the active org cookie and redirect to home
        document.cookie = `ops-map-active-org=${result.data.id};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
        toast.success('Workspace created');
        router.push('/');
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground text-lg font-bold">
            OM
          </div>
          <h1 className="mt-4 text-2xl font-bold">Welcome to Ops Map</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first workspace to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input
              id="workspace-name"
              placeholder="e.g., Acme Corp"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              This is usually your company or team name.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isPending || !name.trim()}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Workspace
          </Button>
        </form>
      </div>
    </div>
  );
}
