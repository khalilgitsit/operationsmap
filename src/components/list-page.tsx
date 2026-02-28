'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { DataTable } from '@/components/data-table';
import { QuickCreatePanel } from '@/components/quick-create-panel';
import { PreviewPanel } from '@/components/preview-panel';
import { type ObjectConfig } from '@/lib/object-config';

interface ListPageProps {
  config: ObjectConfig;
  backHref?: string;
  backLabel?: string;
}

export function ListPage({ config, backHref, backLabel }: ListPageProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [previewState, setPreviewState] = useState<{ type: string; id: string } | null>(null);

  return (
    <div>
      <PageHeader title={config.labelPlural} backHref={backHref} backLabel={backLabel} />
      <DataTable
        config={config}
        onCreateNew={() => setCreateOpen(true)}
        onPreview={(row) => setPreviewState({ type: config.type, id: row.id as string })}
      />

      <QuickCreatePanel
        open={createOpen}
        onOpenChange={setCreateOpen}
        config={config}
      />

      <PreviewPanel
        open={!!previewState}
        onOpenChange={(open) => !open && setPreviewState(null)}
        objectType={previewState?.type || ''}
        recordId={previewState?.id || null}
      />
    </div>
  );
}
