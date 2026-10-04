import React from 'react';
import type { AttendanceEvent } from '../../types/api';
import { formatTime, formatDate, formatRelativeTime } from '../../utils/formatters';
import { ErrorState } from '../common/ErrorState';
import { EmptyState } from '../common/EmptyState';
import { History, LogIn, LogOut } from 'lucide-react';

interface RecentActivityProps {
  events: AttendanceEvent[];
  userMap?: Record<string, string>; // registrationNo -> name
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  events,
  userMap = {},
  loading,
  error,
  onRetry,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Recent Activity
          </h2>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          Audit Timeline
        </span>
      </div>

      {loading && (
        <div className="space-y-3 py-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
      )}

      {error && !loading && (
        <ErrorState
          title="Could not load activity log"
          message={error}
          onRetry={onRetry}
        />
      )}

      {!loading && !error && events.length === 0 && (
        <EmptyState
          title="No Recent Activity"
          message="No attendance audit events found."
        />
      )}

      {!loading && !error && events.length > 0 && (
        <div className="space-y-3">
          {events.slice(0, 10).map((event) => {
            const isCheckIn = event.type === 'CHECK_IN';
            const memberName = userMap[event.registrationNo] || event.registrationNo;

            return (
              <div
                key={event.eventId}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                      isCheckIn
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
                    }`}
                  >
                    {isCheckIn ? (
                      <LogIn className="w-4 h-4" />
                    ) : (
                      <LogOut className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      <span
                        className={
                          isCheckIn
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }
                      >
                        {isCheckIn ? '🟢 ' : '🔴 '}
                      </span>
                      {memberName}{' '}
                      <span className="font-normal text-slate-500 dark:text-slate-400 text-xs">
                        {isCheckIn ? 'checked in' : 'checked out'}
                      </span>
                    </div>
                    {event.task && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md mt-0.5">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Task: </span>
                        {event.task}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right text-xs shrink-0">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatRelativeTime(event.timestamp)}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                    {formatTime(event.timestamp)}, {formatDate(event.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
