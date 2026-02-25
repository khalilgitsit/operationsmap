import { PageHeader } from '@/components/page-header';
import { RecordView } from '@/components/record-view';
import { getObjectConfig } from '@/lib/object-config';

const config = getObjectConfig('subfunction');

export default async function SubfunctionRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <PageHeader title="Subfunction" backHref="/subfunctions" backLabel="Subfunctions" />
      <RecordView config={config} recordId={id} />
    </div>
  );
}
