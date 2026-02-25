import { PageHeader } from '@/components/page-header';

export default async function SoftwareRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <PageHeader title="Software" backHref="/software" backLabel="Software" />
      <p className="text-muted-foreground">Software record {id}.</p>
    </div>
  );
}
