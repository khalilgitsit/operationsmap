'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ReferenceCombobox } from '@/components/reference-combobox';
import { Info } from 'lucide-react';
import { type ObjectConfig } from '@/lib/object-config';
import { createRecord } from '@/server/actions/generic';

interface QuickCreatePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ObjectConfig;
  /** Pre-populated values (e.g., from association context) */
  defaults?: Record<string, unknown>;
  onCreated?: (record: Record<string, unknown>) => void;
}

export function QuickCreatePanel({
  open,
  onOpenChange,
  config,
  defaults,
  onCreated,
}: QuickCreatePanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<Record<string, unknown>>(() => ({
    ...defaults,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({ ...defaults });
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    for (const field of config.quickCreateFields) {
      if (field.required && !formData[field.key]) {
        newErrors[field.key] = `${field.label} is required`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = (addAnother: boolean) => {
    if (!validate()) return;

    startTransition(async () => {
      const result = await createRecord(config.type, formData);
      if (!result.success) {
        setErrors({ _form: result.error });
        return;
      }

      onCreated?.(result.data);

      if (addAnother) {
        resetForm();
      } else {
        onOpenChange(false);
        resetForm();
        router.push(config.recordHref(result.data.id as string));
      }
    });
  };

  const updateField = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const renderField = (field: typeof config.quickCreateFields[number]) => {
    switch (field.type) {
      case 'reference':
        return (
          <ReferenceCombobox
            referenceType={field.referenceType!}
            value={(formData[field.key] as string) || null}
            onChange={(id) => updateField(field.key, id)}
            placeholder={field.placeholder || `Select ${field.label.toLowerCase()}...`}
          />
        );

      case 'select':
        return (
          <Select
            value={(formData[field.key] as string) || ''}
            onValueChange={(v) => updateField(field.key, v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}...`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multi_select':
        return (
          <Input
            placeholder={field.placeholder || 'Comma-separated values'}
            value={Array.isArray(formData[field.key]) ? (formData[field.key] as string[]).join(', ') : ''}
            onChange={(e) => updateField(field.key, e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
          />
        );

      case 'markdown':
        return (
          <Textarea
            placeholder={field.placeholder}
            value={(formData[field.key] as string) || ''}
            onChange={(e) => updateField(field.key, e.target.value)}
            rows={3}
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            placeholder={field.placeholder}
            value={(formData[field.key] as string) || ''}
            onChange={(e) => updateField(field.key, e.target.value || null)}
          />
        );

      case 'number':
      case 'currency':
        return (
          <Input
            type="number"
            placeholder={field.placeholder}
            value={(formData[field.key] as number) ?? ''}
            onChange={(e) => updateField(field.key, e.target.value ? Number(e.target.value) : null)}
          />
        );

      default:
        return (
          <Input
            placeholder={field.placeholder}
            value={(formData[field.key] as string) || ''}
            onChange={(e) => updateField(field.key, e.target.value || null)}
          />
        );
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <SheetContent className="w-[400px] sm:w-[450px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Create {config.label}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {errors._form && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {errors._form}
            </div>
          )}

          {config.quickCreateFields.map((field) => (
            <div key={field.key} className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-0.5">*</span>}
                </Label>
                {field.tooltip && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[250px]">
                      <p>{field.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              {renderField(field)}
              {errors[field.key] && (
                <p className="text-xs text-destructive">{errors[field.key]}</p>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            className="flex-1"
            onClick={() => handleCreate(false)}
            disabled={isPending}
          >
            {isPending ? 'Creating...' : 'Create'}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleCreate(true)}
            disabled={isPending}
          >
            Create & Add Another
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
