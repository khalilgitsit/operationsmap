'use client';

import { ListPage } from '@/components/list-page';
import { getObjectConfig } from '@/lib/object-config';

export default function TemplatesPage() {
  return <ListPage config={getObjectConfig('template')} />;
}
