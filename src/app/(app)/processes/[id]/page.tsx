'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { RecordView } from '@/components/record-view';
import { getObjectConfig } from '@/lib/object-config';

const config = getObjectConfig('process');

export default function ProcessRecordPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <PageHeader title="Process" backHref="/processes" backLabel="Processes" />
      <RecordView config={config} recordId={id} />
    </div>
  );
}
