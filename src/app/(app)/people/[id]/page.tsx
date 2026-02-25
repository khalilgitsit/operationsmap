'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { RecordView } from '@/components/record-view';
import { getObjectConfig } from '@/lib/object-config';

const config = getObjectConfig('person');

export default function PersonRecordPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <PageHeader title="Person" backHref="/people" backLabel="People" />
      <RecordView config={config} recordId={id} />
    </div>
  );
}
