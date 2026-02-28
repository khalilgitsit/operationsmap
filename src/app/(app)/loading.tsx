import { LoadingSpinner } from '@/components/loading-spinner';

export default function Loading() {
  return (
    <div className="flex h-full items-center justify-center">
      <LoadingSpinner size="md" />
    </div>
  );
}
