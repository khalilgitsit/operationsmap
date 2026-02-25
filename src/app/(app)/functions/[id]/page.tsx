import { PageHeader } from '@/components/page-header';

export default async function FunctionRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div>
      <PageHeader title="Function" backHref="/functions" backLabel="Functions" />
      <p className="text-muted-foreground">Function record {id}.</p>
    </div>
  );
}
