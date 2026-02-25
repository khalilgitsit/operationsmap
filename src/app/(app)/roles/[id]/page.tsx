'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { RecordView } from '@/components/record-view';
import { getObjectConfig } from '@/lib/object-config';

const config = getObjectConfig('role');

export default function RoleRecordPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <PageHeader title="Role" backHref="/roles" backLabel="Roles" />
      <RecordView config={config} recordId={id} />
    </div>
  );
}
