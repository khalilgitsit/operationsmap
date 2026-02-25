import { ListPage } from '@/components/list-page';
import { getObjectConfig } from '@/lib/object-config';

export default function FunctionsPage() {
  return <ListPage config={getObjectConfig('function')} />;
}
