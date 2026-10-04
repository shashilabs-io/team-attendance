import React from 'react';
import type { AttendanceSession } from '../../types/api';
import { formatTime, formatMinutes, copyToClipboard } from '../../utils/formatters';
import { ErrorState } from '../common/ErrorState';
import { EmptyState } from '../common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { CalendarCheck, Check, Clock, Copy } from 'lucide-react';

interface TodayAttendanceProps {
  sessions: AttendanceSession[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const TodayAttendance: React.FC<TodayAttendanceProps> = ({
  sessions,
  loading,
  error,
  onRetry,
}) => {
  const { showToast } = useToast();

  const handleCopy = async (text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      showToast(`Copied ${text} to clipboard`, 'success');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Today's Attendance
          </h2>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {sessions.length} {sessions.length === 1 ? 'record' : 'records'}
        </span>
      </div>

      {loading && (
        <div className="space-y-2 py-2">
          <div className="h-8 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
          <div className="h-10 rounded-lg bg-slate-50 dark:bg-slate-800/60 animate-pulse" />
          <div className="h-10 rounded-lg bg-slate-50 dark:bg-slate-800/60 animate-pulse" />
        </div>
      )}

      {error && !loading && (
        <ErrorState
          title="Could not load today's attendance"
          message={error}
          onRetry={onRetry}
        />
      )}

      {!loading && !error && sessions.length === 0 && (
        <EmptyState
          title="No Attendance Today"
          message="No attendance sessions recorded yet for today."
        />
      )}

      {!loading && !error && sessions.length > 0 && (
        <div className="overflow-x-auto custom-scrollbar -mx-5 px-5">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/70 dark:bg-slate-800/50">
                <th scope="col" className="py-3 px-3">Member</th>
                <th scope="col" className="py-3 px-3">Registration No.</th>
                <th scope="col" className="py-3 px-3">Task</th>
                <th scope="col" className="py-3 px-3">Check In</th>
                <th scope="col" className="py-3 px-3">Check Out</th>
                <th scope="col" className="py-3 px-3">Duration</th>
                <th scope="col" className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {sessions.map((session) => (
                <tr
                  key={session.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                    {session.name}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                    <button
                      type="button"
                      onClick={() => handleCopy(session.registrationNo)}
                      title="Click to copy registration number"
                      className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer group"
                    >
                      <span>{session.registrationNo}</span>
                      <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </td>
                  <td
                    className="py-3.5 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate"
                    title={session.task}
                  >
                    {session.task || '-'}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                    {formatTime(session.checkIn)}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                    {session.checkOut ? formatTime(session.checkOut) : '-'}
                  </td>
                  <td className="py-3.5 px-3 text-xs font-medium">
                    {session.status === 'COMPLETED' ? (
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatMinutes(session.durationMinutes)}
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                        <Clock className="w-3 h-3" />
                        In Progress
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3">
                    {session.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        ACTIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        <Check className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                        COMPLETED
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
