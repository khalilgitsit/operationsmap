'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Plus, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  listBenefitOptions,
  getPersonBenefits,
  addPersonBenefit,
  removePersonBenefit,
  createBenefitOption,
  seedDefaultBenefits,
} from '@/server/actions/benefits';

interface BenefitsFieldProps {
  personId: string;
  editable?: boolean;
}

interface BenefitOption {
  id: string;
  label: string;
}

export function BenefitsField({ personId, editable = true }: BenefitsFieldProps) {
  const [isPending, startTransition] = useTransition();
  const [options, setOptions] = useState<BenefitOption[]>([]);
  const [selectedBenefits, setSelectedBenefits] = useState<BenefitOption[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [creatingNew, setCreatingNew] = useState(false);
  const [newLabel, setNewLabel] = useState('');

  const fetchData = useCallback(async () => {
    // Seed defaults on first use (no-op if already seeded)
    await seedDefaultBenefits();
    const [optionsResult, benefitsResult] = await Promise.all([
      listBenefitOptions(),
      getPersonBenefits(personId),
    ]);
    if (optionsResult.success) setOptions(optionsResult.data);
    if (benefitsResult.success) setSelectedBenefits(benefitsResult.data);
  }, [personId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = (optionId: string) => {
    if (selectedBenefits.some((b) => b.id === optionId)) return;
    startTransition(async () => {
      const result = await addPersonBenefit(personId, optionId);
      if (result.success) {
        fetchData();
        toast.success('Benefit added');
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleRemove = (optionId: string) => {
    startTransition(async () => {
      const result = await removePersonBenefit(personId, optionId);
      if (result.success) {
        setSelectedBenefits((prev) => prev.filter((b) => b.id !== optionId));
        toast.success('Benefit removed');
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleCreateNew = () => {
    if (!newLabel.trim()) return;
    const label = newLabel.trim();
    setNewLabel('');
    setCreatingNew(false);
    startTransition(async () => {
      const result = await createBenefitOption(label);
      if (result.success) {
        // Auto-add the new benefit to this person
        await addPersonBenefit(personId, result.data.id);
        fetchData();
        toast.success(`"${label}" created and added`);
      } else {
        toast.error(result.error);
      }
    });
  };

  const selectedIds = new Set(selectedBenefits.map((b) => b.id));
  const filteredOptions = options.filter(
    (o) => o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-2">
      {selectedBenefits.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedBenefits.map((benefit) => (
            <Badge key={benefit.id} variant="secondary" className="gap-1 pr-1">
              {benefit.label}
              {editable && (
                <button
                  onClick={() => handleRemove(benefit.id)}
                  className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                  disabled={isPending}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
      {editable && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-7"
              disabled={isPending}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add benefit
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search benefits..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>
                  {search ? 'No matching benefits.' : 'No benefits defined yet.'}
                </CommandEmpty>
                <CommandGroup>
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={option.id}
                      onSelect={() => {
                        if (selectedIds.has(option.id)) {
                          handleRemove(option.id);
                        } else {
                          handleAdd(option.id);
                        }
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedIds.has(option.id) ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup>
                  {creatingNew ? (
                    <div className="flex items-center gap-1 px-2 py-1.5">
                      <Input
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder="New benefit name"
                        className="h-7 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateNew();
                          }
                          if (e.key === 'Escape') {
                            setCreatingNew(false);
                            setNewLabel('');
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 shrink-0"
                        onClick={handleCreateNew}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <CommandItem onSelect={() => setCreatingNew(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create new benefit
                    </CommandItem>
                  )}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
