import { ListPage } from '@/components/list-page';
import { getObjectConfig } from '@/lib/object-config';

export default function PeoplePage() {
  return <ListPage config={getObjectConfig('person')} />;
}
