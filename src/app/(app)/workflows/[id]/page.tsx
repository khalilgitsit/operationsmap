import { PageHeader } from '@/components/page-header';

export default async function WorkflowMapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <PageHeader title="Workflow Map" backHref="/workflows" backLabel="All Workflows" />
      <p className="text-muted-foreground">Workflow map for {id}.</p>
    </div>
  );
}
