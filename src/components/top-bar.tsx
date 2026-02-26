'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Settings, LogOut, User, Shield, Check, Building2 } from 'lucide-react';
import { NotificationBell } from '@/components/notification-bell';
import { createClient } from '@/lib/supabase/client';
import { OBJECT_TYPES } from '@/lib/navigation';
import { getObjectConfig } from '@/lib/object-config';
import { Button } from '@/components/ui/button';
import { GlobalSearch } from '@/components/global-search';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { QuickCreatePanel } from '@/components/quick-create-panel';
import { CreateWorkspaceDialog } from '@/components/create-workspace-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ObjectConfig } from '@/lib/object-config';
import { listWorkspaces, type Workspace } from '@/server/actions/profile';

interface TopBarProps {
  userEmail: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  activeOrgId?: string;
}

export function TopBar({ userEmail, displayName, avatarUrl, activeOrgId }: TopBarProps) {
  const router = useRouter();
  const supabase = createClient();
  const [createConfig, setCreateConfig] = useState<ObjectConfig | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);

  const initials = (displayName || userEmail.split('@')[0])
    .slice(0, 2)
    .toUpperCase();

  const fetchWorkspaces = useCallback(async () => {
    const result = await listWorkspaces();
    if (result.success) {
      setWorkspaces(result.data);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  function handleSwitchWorkspace(orgId: string) {
    document.cookie = `ops-map-active-org=${orgId};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    router.push('/');
    router.refresh();
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
            OM
          </div>
          <span className="hidden sm:inline">Ops Map</span>
        </Link>

        {/* Global Search */}
        <GlobalSearch />

        <div className="ml-auto flex items-center gap-1">
          {/* Create New */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Create New</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Create New</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {OBJECT_TYPES.map((obj) => (
                <DropdownMenuItem
                  key={obj.type}
                  onClick={() => {
                    try {
                      setCreateConfig(getObjectConfig(obj.type));
                    } catch {
                      // Type not configured yet
                    }
                  }}
                >
                  {obj.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <NotificationBell />

          {/* Settings */}
          <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
            <Link href="/settings">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>

          {/* Profile Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                <Avatar className="h-7 w-7">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName || userEmail} />}
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  {displayName && <span className="text-sm font-medium">{displayName}</span>}
                  <span className="text-xs text-muted-foreground">{userEmail}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Workspace section */}
              {workspaces.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Workspaces
                  </DropdownMenuLabel>
                  {workspaces.map((ws) => (
                    <DropdownMenuItem
                      key={ws.id}
                      onClick={() => handleSwitchWorkspace(ws.id)}
                      className="flex items-center gap-2"
                    >
                      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">{ws.name}</span>
                      {ws.id === activeOrgId && (
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem onClick={() => setShowCreateWorkspace(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create new workspace
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              {/* Profile & Security */}
              <DropdownMenuItem asChild>
                <Link href="/settings/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/security" className="flex items-center">
                  <Shield className="mr-2 h-4 w-4" />
                  Security
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Quick Create Panel (triggered from top bar) */}
      {createConfig && (
        <QuickCreatePanel
          open={!!createConfig}
          onOpenChange={(open) => !open && setCreateConfig(null)}
          config={createConfig}
        />
      )}

      {/* Create Workspace Dialog */}
      <CreateWorkspaceDialog
        open={showCreateWorkspace}
        onOpenChange={setShowCreateWorkspace}
        onCreated={(orgId) => {
          handleSwitchWorkspace(orgId);
        }}
      />
    </>
  );
}
