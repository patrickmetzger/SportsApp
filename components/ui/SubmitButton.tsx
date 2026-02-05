'use client';

import LoadingSpinner from './LoadingSpinner';

interface SubmitButtonProps {
  loading?: boolean;
  disabled?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
  type?: 'submit' | 'button';
  onClick?: () => void;
}

export default function SubmitButton({
  loading = false,
  disabled = false,
  loadingText = 'Saving...',
  children,
  className = '',
  type = 'submit',
  onClick,
}: SubmitButtonProps) {
  const isDisabled = loading || disabled;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`relative flex items-center justify-center gap-2 transition-all ${
        isDisabled ? 'opacity-70 cursor-not-allowed' : ''
      } ${className}`}
    >
      {loading && <LoadingSpinner size="sm" />}
      <span>{loading ? loadingText : children}</span>
    </button>
  );
}
