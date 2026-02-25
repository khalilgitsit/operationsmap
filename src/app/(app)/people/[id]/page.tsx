import { PageHeader } from '@/components/page-header';

export default async function PersonRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <PageHeader title="Person" backHref="/people" backLabel="People" />
      <p className="text-muted-foreground">Person record {id}.</p>
    </div>
  );
}
