'use client';

import { Badge } from '@/components/ui/badge';
import { STATUS_COLORS } from '@/lib/object-config';

export function StatusBadge({ status }: { status: string }) {
  const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-700';
  return (
    <Badge variant="outline" className={`${colorClass} border-0 font-medium`}>
      {status}
    </Badge>
  );
}
