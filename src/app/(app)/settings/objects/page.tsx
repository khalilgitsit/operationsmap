import { PageHeader } from '@/components/page-header';

export default function ObjectConfigPage() {
  return (
    <div>
      <PageHeader title="Object Configuration" backHref="/settings" backLabel="Settings" />
      <p className="text-muted-foreground">Object configuration will be built in a later phase.</p>
    </div>
  );
}
