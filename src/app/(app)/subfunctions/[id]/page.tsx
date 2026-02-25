'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { RecordView } from '@/components/record-view';
import { getObjectConfig } from '@/lib/object-config';

const config = getObjectConfig('subfunction');

export default function SubfunctionRecordPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <PageHeader title="Subfunction" backHref="/subfunctions" backLabel="Subfunctions" />
      <RecordView config={config} recordId={id} />
    </div>
  );
}
