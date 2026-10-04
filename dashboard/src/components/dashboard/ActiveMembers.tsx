import React, { useEffect, useState } from 'react';
import type { ActiveMember } from '../../types/api';
import { formatTime, formatElapsedTime, copyToClipboard } from '../../utils/formatters';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { useToast } from '../../context/ToastContext';
import { Activity, Clock, Copy } from 'lucide-react';

interface ActiveMembersProps {
  members: ActiveMember[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const ActiveMembers: React.FC<ActiveMembersProps> = ({
  members,
  loading,
  error,
  onRetry,
}) => {
  const { showToast } = useToast();
  // Local state to tick elapsed time display every 60s without refetching API
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleCopyRegNo = async (regNo: string) => {
    const ok = await copyToClipboard(regNo);
    if (ok) {
      showToast(`Copied ${regNo} to clipboard`, 'success');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Active Now</h2>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          {members.length} {members.length === 1 ? 'member' : 'members'}
        </span>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse h-28 bg-slate-50 dark:bg-slate-800/40" />
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse h-28 bg-slate-50 dark:bg-slate-800/40" />
        </div>
      )}

      {error && !loading && (
        <ErrorState
          title="Could not load active members"
          message={error}
          onRetry={onRetry}
        />
      )}

      {!loading && !error && members.length === 0 && (
        <EmptyState
          message="Nobody is currently checked in."
          icon={<Activity className="w-5 h-5 text-slate-400" />}
        />
      )}

      {!loading && !error && members.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {members.map((member) => (
            <div
              key={member.registrationNo}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs"></span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {member.name}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyRegNo(member.registrationNo)}
                    title="Click to copy registration number"
                    className="inline-flex items-center gap-1 text-xs font-mono text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mt-1 cursor-pointer group"
                  >
                    <span>{member.registrationNo}</span>
                    <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <Clock className="w-3 h-3" />
                    {formatElapsedTime(member.checkIn)}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs gap-1.5">
                <div className="text-slate-600 dark:text-slate-300 truncate max-w-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Task: </span>
                  <span className="italic">{member.task || 'Not specified'}</span>
                </div>
                <div className="text-slate-500 dark:text-slate-400 shrink-0 font-mono">
                  <span>Checked in: </span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {formatTime(member.checkIn)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
