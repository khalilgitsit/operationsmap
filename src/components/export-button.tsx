'use client';

import { useState, useTransition } from 'react';
import { Download, Copy, FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  exportRecord,
  downloadMarkdown,
  copyToClipboard,
} from '@/lib/markdown-export';
import { getRecord, getAssociations } from '@/server/actions/generic';
import type { ObjectConfig } from '@/lib/object-config';

interface ExportButtonProps {
  config: ObjectConfig;
  recordId: string;
  record?: Record<string, unknown> | null;
  /** Pre-loaded associations keyed by junction table name */
  associations?: Record<string, Record<string, unknown>[]>;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
}

export function ExportButton({
  config,
  recordId,
  record: preloadedRecord,
  associations: preloadedAssociations,
  variant = 'outline',
  size = 'sm',
}: ExportButtonProps) {
  const [isPending, startTransition] = useTransition();

  async function getExportContent(): Promise<string | null> {
    // Get record data
    let record = preloadedRecord;
    if (!record) {
      const result = await getRecord(config.type, recordId);
      if (!result.success) {
        toast.error('Failed to load record for export');
        return null;
      }
      record = result.data;
    }

    // Get associations
    let associations = preloadedAssociations;
    if (!associations) {
      associations = {};
      const assocFetches = config.associations.map(async (assoc) => {
        const result = await getAssociations(config.type, recordId, assoc.junctionTable, assoc.targetType);
        if (result.success) {
          associations![assoc.junctionTable] = result.data;
        }
      });
      await Promise.all(assocFetches);
    }

    return exportRecord(config.type, record, associations);
  }

  function getFilename(record: Record<string, unknown> | null | undefined): string {
    if (!record) return `${config.type}-export.md`;
    const title = config.titleFields
      ? config.titleFields.map((f) => record[f] || '').join('-').trim()
      : (record[config.titleField] as string) || 'untitled';
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return `${slug}.md`;
  }

  function handleDownload() {
    startTransition(async () => {
      const content = await getExportContent();
      if (content) {
        downloadMarkdown(content, getFilename(preloadedRecord));
        toast.success('Downloaded as markdown');
      }
    });
  }

  function handleCopy() {
    startTransition(async () => {
      const content = await getExportContent();
      if (content) {
        const ok = await copyToClipboard(content);
        if (ok) {
          toast.success('Copied to clipboard');
        } else {
          toast.error('Failed to copy to clipboard');
        }
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5 mr-1" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDownload}>
          <FileDown className="mr-2 h-4 w-4" />
          Download as .md
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopy}>
          <Copy className="mr-2 h-4 w-4" />
          Copy to Clipboard
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
