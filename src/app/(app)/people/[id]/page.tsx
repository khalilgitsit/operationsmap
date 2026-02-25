import { PageHeader } from '@/components/page-header';
import { RecordView } from '@/components/record-view';
import { getObjectConfig } from '@/lib/object-config';

const config = getObjectConfig('person');

export default async function PersonRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <PageHeader title="Person" backHref="/people" backLabel="People" />
      <RecordView config={config} recordId={id} />
    </div>
  );
}
