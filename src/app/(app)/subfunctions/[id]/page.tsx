import { PageHeader } from '@/components/page-header';

export default async function SubfunctionRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <PageHeader title="Subfunction" backHref="/subfunctions" backLabel="Subfunctions" />
      <p className="text-muted-foreground">Subfunction record {id}.</p>
    </div>
  );
}
