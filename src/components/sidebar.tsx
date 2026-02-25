'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_GROUPS } from '@/lib/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const SIDEBAR_KEY = 'ops-map-sidebar-collapsed';

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Load sidebar state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored === 'true') setCollapsed(true);

    // Open the group that contains the current route
    const initial: Record<string, boolean> = {};
    NAV_GROUPS.forEach((group) => {
      const isActive = group.items.some(
        (item) => pathname === item.href || pathname.startsWith(item.href + '/')
      );
      if (isActive) initial[group.label] = true;
    });
    setOpenGroups(initial);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(SIDEBAR_KEY, String(next));
  };

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const isExpanded = !collapsed || hovering;

  return (
    <aside
      className={cn(
        'relative flex h-full flex-col border-r bg-background transition-all duration-200',
        isExpanded ? 'w-60' : 'w-14'
      )}
      onMouseEnter={() => collapsed && setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Toggle button */}
      <button
        onClick={toggleCollapsed}
        className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-accent"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {NAV_GROUPS.map((group) => {
          const isGroupActive = group.items.some(
            (item) =>
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href + '/'))
          );
          const isOpen = openGroups[group.label] ?? false;
          const isSingleItem = group.items.length === 1;

          if (isSingleItem) {
            const item = group.items[0];
            const isActive =
              pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href + '/'));

            if (!isExpanded) {
              return (
                <Tooltip key={group.label} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex h-9 w-full items-center justify-center rounded-md text-sm',
                        isActive
                          ? 'bg-accent text-accent-foreground font-medium'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link
                key={group.label}
                href={item.href}
                className={cn(
                  'flex h-9 items-center gap-3 rounded-md px-3 text-sm',
                  isActive
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          }

          // Multi-item group
          if (!isExpanded) {
            return (
              <Tooltip key={group.label} delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      'flex h-9 w-full items-center justify-center rounded-md text-sm',
                      isGroupActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <group.icon className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="flex flex-col gap-1 p-2">
                  <span className="text-xs font-medium">{group.label}</span>
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2 rounded px-2 py-1 text-sm',
                        pathname === item.href ||
                          (item.href !== '/' && pathname.startsWith(item.href + '/'))
                          ? 'bg-accent font-medium'
                          : 'hover:bg-accent'
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <div key={group.label}>
              <button
                onClick={() => toggleGroup(group.label)}
                className={cn(
                  'flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm',
                  isGroupActive
                    ? 'text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:text-accent-foreground'
                )}
              >
                <group.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate text-left">{group.label}</span>
                <ChevronDown
                  className={cn(
                    'h-3 w-3 shrink-0 transition-transform',
                    isOpen && 'rotate-180'
                  )}
                />
              </button>
              {isOpen && (
                <div className="ml-4 space-y-0.5 border-l pl-3">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/' && pathname.startsWith(item.href + '/'));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex h-8 items-center gap-2 rounded-md px-2 text-sm',
                          isActive
                            ? 'bg-accent text-accent-foreground font-medium'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <item.icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
