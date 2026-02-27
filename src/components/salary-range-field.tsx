'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';

interface SalaryRangeFieldProps {
  min: number | null;
  max: number | null;
  editing: boolean;
  onSave: (min: number | null, max: number | null) => void;
  onCancel: () => void;
  editable?: boolean;
}

export function SalaryRangeField({
  min,
  max,
  editing,
  onSave,
  onCancel,
  editable = true,
}: SalaryRangeFieldProps) {
  const [editMin, setEditMin] = useState<string>(min?.toString() ?? '');
  const [editMax, setEditMax] = useState<string>(max?.toString() ?? '');

  // Reset edit values when entering edit mode
  useEffect(() => {
    if (editing) {
      setEditMin(min?.toString() ?? '');
      setEditMax(max?.toString() ?? '');
    }
  }, [editing, min, max]);

  if (editing && editable) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
          <Input
            type="number"
            value={editMin}
            onChange={(e) => setEditMin(e.target.value)}
            placeholder="Min"
            className="pl-6 h-8"
            autoFocus
          />
        </div>
        <span className="text-muted-foreground text-sm">–</span>
        <div className="relative flex-1">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
          <Input
            type="number"
            value={editMax}
            onChange={(e) => setEditMax(e.target.value)}
            placeholder="Max"
            className="pl-6 h-8"
          />
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => {
            const minVal = editMin ? parseInt(editMin, 10) : null;
            const maxVal = editMax ? parseInt(editMax, 10) : null;
            onSave(minVal, maxVal);
          }}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Display mode
  if (min == null && max == null) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

  if (min != null && max != null) {
    return <span className="text-sm">{formatCurrency(min)} – {formatCurrency(max)}</span>;
  }
  if (min != null) {
    return <span className="text-sm">From {formatCurrency(min)}</span>;
  }
  return <span className="text-sm">Up to {formatCurrency(max!)}</span>;
}
