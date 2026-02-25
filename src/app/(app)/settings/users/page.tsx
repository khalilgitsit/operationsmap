import { PageHeader } from '@/components/page-header';

export default function UserManagementPage() {
  return (
    <div>
      <PageHeader title="User Management" backHref="/settings" backLabel="Settings" />
      <p className="text-muted-foreground">User management will be built in a later phase.</p>
    </div>
  );
}
