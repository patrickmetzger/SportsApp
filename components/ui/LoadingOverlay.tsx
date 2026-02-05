'use client';

import LoadingSpinner from './LoadingSpinner';

interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" className="text-blue-600" />
        <p className="text-lg font-medium text-gray-700">{message}</p>
      </div>
    </div>
  );
}
