'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Atom,
  ListChecks,
  FolderTree,
  Layers,
  Users,
  UserCog,
  Monitor,
  Activity,
  Lightbulb,
  ArrowRight,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/status-badge';
import { getDashboardData, type DashboardData, type ActivityEntry, type Suggestion } from '@/server/actions/dashboard';

const RECORD_HREFS: Record<string, (id: string) => string> = {
  function: (id) => `/functions/${id}`,
  subfunction: (id) => `/subfunctions/${id}`,
  process: (id) => `/processes/${id}`,
  core_activity: (id) => `/core-activities/${id}`,
  person: (id) => `/people/${id}`,
  role: (id) => `/roles/${id}`,
  software: (id) => `/software/${id}`,
};

const TYPE_LABELS: Record<string, string> = {
  function: 'Function',
  subfunction: 'Subfunction',
  process: 'Process',
  core_activity: 'Core Activity',
  person: 'Person',
  role: 'Role',
  software: 'Software',
};

function formatAction(entry: ActivityEntry): string {
  const typeLabel = TYPE_LABELS[entry.recordType] || entry.recordType;
  switch (entry.action) {
    case 'created':
      return `Created ${typeLabel}`;
    case 'deleted':
      return `Deleted ${typeLabel}`;
    case 'status_changed':
      return `Changed status to "${entry.newValue}"`;
    case 'updated':
      return `Updated ${entry.fieldName || 'record'}`;
    case 'association_added':
      return `Added association`;
    case 'association_removed':
      return `Removed association`;
    case 'comment':
      return `Commented`;
    default:
      return entry.action;
  }
}

function formatTimeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function StatusCountLink({
  count,
  label,
  href,
}: {
  count: number;
  label: string;
  href: string;
}) {
  return (
    <Link href={href} className="group flex items-center gap-1.5 hover:underline">
      <span className="text-lg font-semibold group-hover:text-primary">{count}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const result = await getDashboardData();
    if (result.success) {
      setData(result.data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading || !data) return <DashboardSkeleton />;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Core Activities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Core Activities</CardTitle>
            <Atom className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Link href="/core-activities" className="hover:underline">
                {data.coreActivities.total}
              </Link>
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              <StatusCountLink count={data.coreActivities.active} label="Active" href="/core-activities?status=Active" />
              <StatusCountLink count={data.coreActivities.draft} label="Draft" href="/core-activities?status=Draft" />
              <StatusCountLink count={data.coreActivities.needsUpdate} label="Needs Update" href="/core-activities?status=Needs+Update" />
            </div>
          </CardContent>
        </Card>

        {/* Processes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Processes</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Link href="/processes" className="hover:underline">
                {data.processes.total}
              </Link>
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              <StatusCountLink count={data.processes.active} label="Active" href="/processes?status=Active" />
              <StatusCountLink count={data.processes.draft} label="Draft" href="/processes?status=Draft" />
              <StatusCountLink count={data.processes.empty} label="Empty" href="/processes" />
            </div>
          </CardContent>
        </Card>

        {/* Functions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Functions</CardTitle>
            <FolderTree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Link href="/functions" className="hover:underline">
                {data.functions.total}
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Subfunctions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Subfunctions</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Link href="/subfunctions" className="hover:underline">
                {data.subfunctions.total}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">People</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Link href="/people" className="hover:underline">
                {data.people.total}
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Roles</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Link href="/roles" className="hover:underline">
                {data.roles.total}
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Software Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Link href="/software" className="hover:underline">
                {formatCurrency(data.softwareSpend)}
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mt-1">annualized</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity + Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No activity yet. Start by creating some records.
              </p>
            ) : (
              <div className="space-y-3">
                {data.recentActivity.map((entry) => {
                  const href = RECORD_HREFS[entry.recordType]?.(entry.recordId);
                  return (
                    <div key={entry.id} className="flex items-start gap-3 text-sm">
                      <div className="shrink-0 mt-0.5 h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                        {(entry.userEmail || entry.userId).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p>
                          <span className="text-muted-foreground">{formatAction(entry)}</span>
                          {href ? (
                            <Link href={href} className="ml-1 font-medium hover:underline">
                              {entry.recordTitle}
                            </Link>
                          ) : (
                            <span className="ml-1 font-medium">{entry.recordTitle}</span>
                          )}
                        </p>
                        {entry.action === 'comment' && entry.commentText && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            &ldquo;{entry.commentText}&rdquo;
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatTimeAgo(entry.createdAt)}
                        </p>
                      </div>
                      {entry.action === 'status_changed' && typeof entry.newValue === 'string' && (
                        <StatusBadge status={entry.newValue} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Suggested Next Actions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Suggested Next Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.suggestions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Looking good! No suggestions at this time.
              </p>
            ) : (
              <div className="space-y-2">
                {data.suggestions.map((suggestion) => (
                  <Link
                    key={suggestion.id}
                    href={suggestion.href}
                    className="group flex items-center gap-3 rounded-md border p-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex-1 text-sm">{suggestion.message}</div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
