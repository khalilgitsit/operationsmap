'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { DocumentView } from '@/components/document-view';
import { getObjectConfig } from '@/lib/object-config';

const config = getObjectConfig('sop');

export default function SOPRecordPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <PageHeader title="SOP" backHref="/sops" backLabel="SOPs" />
      <DocumentView config={config} recordId={id} />
    </div>
  );
}
