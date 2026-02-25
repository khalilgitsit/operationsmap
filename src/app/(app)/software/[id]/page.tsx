'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { RecordView } from '@/components/record-view';
import { getObjectConfig } from '@/lib/object-config';

const config = getObjectConfig('software');

export default function SoftwareRecordPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <PageHeader title="Software" backHref="/software" backLabel="Software" />
      <RecordView config={config} recordId={id} />
    </div>
  );
}
