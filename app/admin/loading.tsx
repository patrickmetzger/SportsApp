import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AdminLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" className="text-blue-600" />
        <p className="text-gray-600">Loading admin panel...</p>
      </div>
    </div>
  );
}
