import { PageHeader } from '@/components/page-header';

export default async function CoreActivityRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <PageHeader title="Core Activity" backHref="/core-activities" backLabel="Core Activities" />
      <p className="text-muted-foreground">Core Activity record {id}.</p>
    </div>
  );
}
