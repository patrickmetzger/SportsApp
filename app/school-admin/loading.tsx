import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function SchoolAdminLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" className="text-green-600" />
        <p className="text-gray-600">Loading school admin...</p>
      </div>
    </div>
  );
}
