import { PageHeader } from '@/components/page-header';

export default function CompanyProfilePage() {
  return (
    <div>
      <PageHeader title="Company Profile" backHref="/settings" backLabel="Settings" />
      <p className="text-muted-foreground">Company profile settings will be built in a later phase.</p>
    </div>
  );
}
