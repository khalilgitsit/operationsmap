import type { Metadata } from 'next';
import { PageHeader } from '@/components/page-header';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Settings' };

const settingsSections = [
  { label: 'Company Profile', href: '/settings/company', description: 'Manage your organization details' },
  { label: 'Object Configuration', href: '/settings/objects', description: 'Configure object types and custom properties' },
  { label: 'User Management', href: '/settings/users', description: 'Manage team members and permissions' },
];

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="Settings" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-lg border p-4 hover:bg-accent transition-colors"
          >
            <h3 className="font-medium">{section.label}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
