'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { RecordView } from '@/components/record-view';
import { getObjectConfig } from '@/lib/object-config';

const config = getObjectConfig('checklist');

export default function ChecklistRecordPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div>
      <PageHeader title="Checklist" backHref="/checklists" backLabel="Checklists" />
      <RecordView config={config} recordId={id} />
    </div>
  );
}
