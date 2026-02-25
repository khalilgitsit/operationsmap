import { ListPage } from '@/components/list-page';
import { getObjectConfig } from '@/lib/object-config';

export default function CoreActivitiesPage() {
  return <ListPage config={getObjectConfig('core_activity')} />;
}
