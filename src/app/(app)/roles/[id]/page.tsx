import { PageHeader } from '@/components/page-header';
import { RecordView } from '@/components/record-view';
import { getObjectConfig } from '@/lib/object-config';

const config = getObjectConfig('role');

export default async function RoleRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <PageHeader title="Role" backHref="/roles" backLabel="Roles" />
      <RecordView config={config} recordId={id} />
    </div>
  );
}
