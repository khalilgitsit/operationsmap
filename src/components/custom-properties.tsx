'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface CustomProperty {
  id: string;
  property_name: string;
  property_type: string;
  options: string[] | null;
  position: number;
}

interface CustomPropertyValue {
  id: string;
  custom_property_id: string;
  value: unknown;
}

type ObjectTypeEnum = 'function' | 'subfunction' | 'process' | 'core_activity' | 'person' | 'role' | 'software';

interface CustomPropertiesProps {
  recordId: string;
  objectType: string;
}

export function CustomProperties({ recordId, objectType: rawObjectType }: CustomPropertiesProps) {
  const objectType = rawObjectType as ObjectTypeEnum;
  const [isPending, startTransition] = useTransition();
  const [properties, setProperties] = useState<CustomProperty[]>([]);
  const [values, setValues] = useState<Record<string, CustomPropertyValue>>({});
  const [loading, setLoading] = useState(true);
  const [editingProp, setEditingProp] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<unknown>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    // Fetch custom property definitions for this object type
    const { data: props } = await supabase
      .from('custom_properties')
      .select('*')
      .eq('object_type', objectType as 'function' | 'subfunction' | 'process' | 'core_activity' | 'person' | 'role' | 'software')
      .order('position', { ascending: true });

    if (props && props.length > 0) {
      setProperties(props.map((p) => ({
        ...p,
        options: p.options as string[] | null,
      })));

      // Fetch values for this record
      const propIds = props.map((p) => p.id);
      const { data: vals } = await supabase
        .from('custom_property_values')
        .select('*')
        .eq('record_id', recordId)
        .eq('record_type', objectType)
        .in('custom_property_id', propIds);

      if (vals) {
        const valueMap: Record<string, CustomPropertyValue> = {};
        for (const v of vals) {
          valueMap[v.custom_property_id] = {
            id: v.id,
            custom_property_id: v.custom_property_id,
            value: v.value,
          };
        }
        setValues(valueMap);
      }
    }

    setLoading(false);
  }, [recordId, objectType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveValue = (propertyId: string, value: unknown) => {
    startTransition(async () => {
      const supabase = createClient();
      const existing = values[propertyId];

      if (existing) {
        await supabase
          .from('custom_property_values')
          .update({ value: value as null })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('custom_property_values')
          .insert({
            custom_property_id: propertyId,
            record_id: recordId,
            record_type: objectType,
            value: value as null,
          } as never);
      }

      setValues((prev) => ({
        ...prev,
        [propertyId]: {
          id: existing?.id || '',
          custom_property_id: propertyId,
          value,
        },
      }));
      setEditingProp(null);
    });
  };

  if (loading) {
    return (
      <div className="space-y-3 mt-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (properties.length === 0) return null;

  return (
    <div className="mt-6">
      <Separator className="mb-4" />
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Custom Properties
      </h3>
      <div className="space-y-3">
        {properties.map((prop) => {
          const currentValue = values[prop.id]?.value;
          const isEditing = editingProp === prop.id;

          return (
            <div key={prop.id} className="flex items-start gap-4 py-1">
              <Label className="text-sm text-muted-foreground shrink-0 w-36 pt-1">
                {prop.property_name}
              </Label>
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    {renderCustomPropertyInput(prop, editValue, setEditValue)}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => saveValue(prop.id, editValue)}
                      disabled={isPending}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => setEditingProp(null)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className="text-sm py-1 cursor-pointer hover:bg-muted/50 rounded px-2 -mx-2 flex items-center gap-1 group"
                    onClick={() => {
                      setEditingProp(prop.id);
                      setEditValue(currentValue ?? '');
                    }}
                  >
                    <span>{formatCustomValue(currentValue, prop.property_type)}</span>
                    <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function renderCustomPropertyInput(
  prop: CustomProperty,
  value: unknown,
  onChange: (v: unknown) => void
) {
  switch (prop.property_type) {
    case 'select':
      return (
        <Select value={(value as string) || ''} onValueChange={onChange}>
          <SelectTrigger className="h-8 flex-1">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {(prop.options || []).map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case 'multi_select':
      return (
        <Input
          autoFocus
          className="h-8 flex-1"
          placeholder="Comma-separated values"
          value={Array.isArray(value) ? (value as string[]).join(', ') : (value as string) || ''}
          onChange={(e) => onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
        />
      );

    case 'number':
    case 'currency':
      return (
        <Input
          type="number"
          autoFocus
          className="h-8 flex-1"
          value={value as number ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        />
      );

    case 'date':
      return (
        <Input
          type="date"
          autoFocus
          className="h-8 flex-1"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value || null)}
        />
      );

    case 'boolean':
      return (
        <Select value={String(value || false)} onValueChange={(v) => onChange(v === 'true')}>
          <SelectTrigger className="h-8 flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      );

    case 'url':
      return (
        <Input
          type="url"
          autoFocus
          className="h-8 flex-1"
          placeholder="https://..."
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value || null)}
        />
      );

    case 'email':
      return (
        <Input
          type="email"
          autoFocus
          className="h-8 flex-1"
          placeholder="email@example.com"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value || null)}
        />
      );

    case 'phone':
      return (
        <Input
          type="tel"
          autoFocus
          className="h-8 flex-1"
          placeholder="+1 (555) 000-0000"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value || null)}
        />
      );

    default: // text
      return (
        <Input
          autoFocus
          className="h-8 flex-1"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value || null)}
        />
      );
  }
}

function formatCustomValue(value: unknown, type: string): string {
  if (value === null || value === undefined || value === '') return '—';
  if (type === 'boolean') return value ? 'Yes' : 'No';
  if (type === 'currency') return `$${Number(value).toLocaleString()}`;
  if (type === 'date') return new Date(value as string).toLocaleDateString();
  if (type === 'multi_select' && Array.isArray(value)) return (value as string[]).join(', ');
  return String(value);
}
