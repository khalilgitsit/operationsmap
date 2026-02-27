'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ReferenceCombobox } from '@/components/reference-combobox';
import { getRecord } from '@/server/actions/generic';
import { getObjectConfig, getRecordTitle } from '@/lib/object-config';
import { Plus, X } from 'lucide-react';
import Link from 'next/link';

interface MultiReferenceFieldProps {
  referenceType: string;
  value: string[];
  onChange: (value: string[]) => void;
  editable?: boolean;
}

export function MultiReferenceField({
  referenceType,
  value,
  onChange,
  editable = true,
}: MultiReferenceFieldProps) {
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);

  const refConfig = getObjectConfig(referenceType);

  const fetchLabels = useCallback(async () => {
    if (!value || value.length === 0) return;
    const newLabels: Record<string, string> = {};
    for (const id of value) {
      if (labels[id]) {
        newLabels[id] = labels[id];
        continue;
      }
      const result = await getRecord(referenceType, id);
      if (result.success && result.data) {
        newLabels[id] = getRecordTitle(result.data, refConfig);
      }
    }
    setLabels(newLabels);
  }, [value, referenceType, refConfig, labels]);

  useEffect(() => {
    fetchLabels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleAdd = (id: string | null) => {
    if (!id) return;
    if (value.includes(id)) return;
    onChange([...value, id]);
    setAdding(false);
  };

  const handleRemove = (id: string) => {
    onChange(value.filter((v) => v !== id));
  };

  if (!value || value.length === 0) {
    if (!editable) return <span className="text-sm text-muted-foreground">—</span>;
    return (
      <div>
        {adding ? (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <ReferenceCombobox
                referenceType={referenceType}
                value={null}
                onChange={(id) => handleAdd(id)}
                placeholder={`Add ${refConfig.label.toLowerCase()}...`}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setAdding(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add {refConfig.label.toLowerCase()}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((id) => (
          <Badge key={id} variant="secondary" className="gap-1 pr-1">
            <Link
              href={refConfig.recordHref(id)}
              className="hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {labels[id] || 'Loading...'}
            </Link>
            {editable && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(id);
                }}
                className="ml-0.5 rounded-full hover:bg-muted p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>
      {editable && (
        adding ? (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <ReferenceCombobox
                referenceType={referenceType}
                value={null}
                onChange={(id) => handleAdd(id)}
                placeholder={`Add ${refConfig.label.toLowerCase()}...`}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-7"
            onClick={() => setAdding(true)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        )
      )}
    </div>
  );
}
