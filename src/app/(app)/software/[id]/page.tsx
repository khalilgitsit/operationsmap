import { PageHeader } from '@/components/page-header';
import { RecordView } from '@/components/record-view';
import { getObjectConfig } from '@/lib/object-config';

const config = getObjectConfig('software');

export default async function SoftwareRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <PageHeader title="Software" backHref="/software" backLabel="Software" />
      <RecordView config={config} recordId={id} />
    </div>
  );
}
