'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { RecordView } from '@/components/record-view';
import { getObjectConfig } from '@/lib/object-config';

const config = getObjectConfig('core_activity');

export default function CoreActivityRecordPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <PageHeader title="Core Activity" backHref="/core-activities" backLabel="Core Activities" />
      <RecordView config={config} recordId={id} />
    </div>
  );
}
