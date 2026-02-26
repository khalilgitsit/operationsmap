'use client';

import { ListPage } from '@/components/list-page';
import { getObjectConfig } from '@/lib/object-config';

export default function ChecklistsPage() {
  return <ListPage config={getObjectConfig('checklist')} />;
}
