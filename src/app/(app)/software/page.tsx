'use client';

import { ListPage } from '@/components/list-page';
import { getObjectConfig } from '@/lib/object-config';

export default function SoftwarePage() {
  return <ListPage config={getObjectConfig('software')} />;
}
