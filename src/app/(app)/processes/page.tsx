import { ListPage } from '@/components/list-page';
import { getObjectConfig } from '@/lib/object-config';

export default function ProcessesPage() {
  return <ListPage config={getObjectConfig('process')} />;
}
