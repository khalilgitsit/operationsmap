import { PageHeader } from '@/components/page-header';
import { RecordView } from '@/components/record-view';
import { getObjectConfig } from '@/lib/object-config';

const config = getObjectConfig('function');

export default async function FunctionRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <PageHeader title="Function" backHref="/functions" backLabel="Functions" />
      <RecordView config={config} recordId={id} />
    </div>
  );
}
