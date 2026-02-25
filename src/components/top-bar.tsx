'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Plus, Bell, Settings, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { OBJECT_TYPES } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TopBarProps {
  userEmail: string;
}

export function TopBar({ userEmail }: TopBarProps) {
  const router = useRouter();
  const supabase = createClient();

  const initials = userEmail
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
          OM
        </div>
        <span className="hidden sm:inline">Ops Map</span>
      </Link>

      {/* Search (placeholder) */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search..."
          className="pl-9 h-9"
          disabled
        />
      </div>

      <div className="flex items-center gap-1">
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
              <DropdownMenuItem key={obj.type} disabled>
                {obj.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications (placeholder) */}
        <Button variant="ghost" size="icon" className="h-9 w-9" disabled>
          <Bell className="h-4 w-4" />
        </Button>

        {/* Ops Coach placeholder slot */}
        <div className="hidden h-9 w-9 sm:block" />

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
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{userEmail}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
