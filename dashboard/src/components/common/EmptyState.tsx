import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center my-2">
      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
        {icon || <Inbox className="w-5 h-5" />}
      </div>
      {title && (
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
          {title}
        </h4>
      )}
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">{message}</p>
    </div>
  );
};
