'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { RecordView } from '@/components/record-view';
import { getObjectConfig } from '@/lib/object-config';

const config = getObjectConfig('sop');

export default function SOPRecordPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <PageHeader title="SOP" backHref="/sops" backLabel="SOPs" />
      <RecordView config={config} recordId={id} />
    </div>
  );
}
