'use client';

import { useState, useEffect, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchRecords } from '@/server/actions/generic';

interface ReferenceComboboxProps {
  referenceType: string;
  value: string | null;
  onChange: (value: string | null, label: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ReferenceCombobox({
  referenceType,
  value,
  onChange,
  placeholder = 'Select...',
  disabled,
  className,
}: ReferenceComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<{ id: string; label: string }[]>([]);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchOptions = useCallback(async (query: string) => {
    setLoading(true);
    const result = await searchRecords(referenceType, query, 20);
    if (result.success) {
      setOptions(result.data);
      if (value && !selectedLabel) {
        const match = result.data.find((o) => o.id === value);
        if (match) setSelectedLabel(match.label);
      }
    }
    setLoading(false);
  }, [referenceType, value, selectedLabel]);

  useEffect(() => {
    if (open) {
      fetchOptions(search);
    }
  }, [open, search, fetchOptions]);

  // Load initial label for the value
  useEffect(() => {
    if (value && !selectedLabel) {
      fetchOptions('');
    }
  }, [value, selectedLabel, fetchOptions]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between font-normal', !value && 'text-muted-foreground', className)}
        >
          {value ? selectedLabel || 'Loading...' : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>{loading ? 'Loading...' : 'No results found.'}</CommandEmpty>
            <CommandGroup>
              {value && (
                <CommandItem
                  value="_clear"
                  onSelect={() => {
                    onChange(null, '');
                    setSelectedLabel('');
                    setOpen(false);
                  }}
                >
                  <span className="text-muted-foreground">Clear selection</span>
                </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.id}
                  onSelect={() => {
                    onChange(option.id, option.label);
                    setSelectedLabel(option.label);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === option.id ? 'opacity-100' : 'opacity-0')} />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
