import { PageHeader } from '@/components/page-header';
import { RecordView } from '@/components/record-view';
import { getObjectConfig } from '@/lib/object-config';

const config = getObjectConfig('process');

export default async function ProcessRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <PageHeader title="Process" backHref="/processes" backLabel="Processes" />
      <RecordView config={config} recordId={id} />
    </div>
  );
}
