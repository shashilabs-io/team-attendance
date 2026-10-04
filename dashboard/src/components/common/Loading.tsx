import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  message = 'Loading...',
  size = 'md',
  fullPage = false,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  const content = (
    <div className="flex flex-col items-center justify-center p-6 text-slate-500 dark:text-slate-400">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600 dark:text-blue-400 mb-2`} />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] w-full">
        {content}
      </div>
    );
  }

  return content;
};
