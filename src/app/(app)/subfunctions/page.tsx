import { ListPage } from '@/components/list-page';
import { getObjectConfig } from '@/lib/object-config';

export default function SubfunctionsPage() {
  return <ListPage config={getObjectConfig('subfunction')} />;
}
