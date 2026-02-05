import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" className="text-teal-600" />
        <p className="text-slate-600">Loading dashboard...</p>
      </div>
    </div>
  );
}
