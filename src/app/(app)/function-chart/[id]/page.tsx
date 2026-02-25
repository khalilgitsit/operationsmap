import { PageHeader } from '@/components/page-header';

export default async function FunctionChartDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <PageHeader title="Function Detail" backHref="/function-chart" backLabel="Function Chart" />
      <p className="text-muted-foreground">Function detail view for {id}.</p>
    </div>
  );
}
