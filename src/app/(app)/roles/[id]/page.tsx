import { PageHeader } from '@/components/page-header';

export default async function RoleRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <PageHeader title="Role" backHref="/roles" backLabel="Roles" />
      <p className="text-muted-foreground">Role record {id}.</p>
    </div>
  );
}
