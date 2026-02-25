import { ListPage } from '@/components/list-page';
import { getObjectConfig } from '@/lib/object-config';

export default function RolesPage() {
  return <ListPage config={getObjectConfig('role')} />;
}
