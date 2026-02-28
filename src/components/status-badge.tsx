'use client';

import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS, DEFAULT_BADGE_COLORS } from '@/lib/object-config';

export function StatusBadge({ status }: { status: string }) {
  const colorClass = STATUS_COLORS[status] || DEFAULT_BADGE_COLORS;
  return (
    <Badge variant="outline" className={`${colorClass} border-0 font-medium`}>
      {status}
    </Badge>
  );
}
