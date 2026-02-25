import { PageHeader } from '@/components/page-header';

export default async function ProcessRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <PageHeader title="Process" backHref="/processes" backLabel="Processes" />
      <p className="text-muted-foreground">Process record {id}.</p>
    </div>
  );
}
