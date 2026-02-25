import { PageHeader } from '@/components/page-header';
import { RecordView } from '@/components/record-view';
import { getObjectConfig } from '@/lib/object-config';

const config = getObjectConfig('core_activity');

export default async function CoreActivityRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <PageHeader title="Core Activity" backHref="/core-activities" backLabel="Core Activities" />
      <RecordView config={config} recordId={id} />
    </div>
  );
}
