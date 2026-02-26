'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { DocumentView } from '@/components/document-view';
import { getObjectConfig } from '@/lib/object-config';

const config = getObjectConfig('template');

export default function TemplateRecordPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <PageHeader title="Template" backHref="/templates" backLabel="Templates" />
      <DocumentView config={config} recordId={id} />
    </div>
  );
}
