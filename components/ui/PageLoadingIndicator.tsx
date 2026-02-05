'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function PageLoadingIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Reset loading state when route changes complete
    setIsLoading(false);
    setProgress(0);
  }, [pathname, searchParams]);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;

    const handleStart = () => {
      setIsLoading(true);
      setProgress(0);

      // Simulate progress
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);
    };

    const handleComplete = () => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 200);
    };

    // Listen for link clicks to detect navigation
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor && anchor.href && !anchor.target && !anchor.download) {
        const url = new URL(anchor.href);
        if (url.origin === window.location.origin && url.pathname !== pathname) {
          handleStart();
        }
      }
    };

    // Listen for form submissions
    const handleSubmit = () => {
      handleStart();
    };

    document.addEventListener('click', handleClick);
    document.addEventListener('submit', handleSubmit);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('submit', handleSubmit);
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [pathname]);

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-gray-200">
      <div
        className="h-full bg-blue-600 transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
