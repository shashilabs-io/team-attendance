import React, { useState, useEffect } from 'react';
import type { AttendanceSession } from '../../types/api';
import { updateSessionAdmin } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { X, CheckCircle, AlertCircle, Shield } from 'lucide-react';

interface EditSessionModalProps {
  session: AttendanceSession | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Convert ISO string to format required by <input type="datetime-local" />
function toDateTimeLocal(isoString?: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export const EditSessionModal: React.FC<EditSessionModalProps> = ({
  session,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();

  const [checkInTime, setCheckInTime] = useState<string>('');
  const [checkOutTime, setCheckOutTime] = useState<string>('');
  const [task, setTask] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      setCheckInTime(toDateTimeLocal(session.checkIn));
      setCheckOutTime(toDateTimeLocal(session.checkOut));
      setTask(session.task || '');
      setRemarks(session.remarks || '');
      setErrorMessage(null);
    }
  }, [session]);

  if (!isOpen || !session) return null;

  // Calculate live preview duration
  let previewDurationMinutes: number | null = null;
  if (checkInTime && checkOutTime) {
    const start = new Date(checkInTime).getTime();
    const end = new Date(checkOutTime).getTime();
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      previewDurationMinutes = Math.round((end - start) / (1000 * 60));
    }
  }

  const formatMinutesPretty = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const m = mins % 60;
    if (hours === 0) return `${m} mins`;
    return `${hours}h ${m}m`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInTime) {
      setErrorMessage('Check-in time is required.');
      return;
    }

    if (checkOutTime) {
      const start = new Date(checkInTime).getTime();
      const end = new Date(checkOutTime).getTime();
      if (end < start) {
        setErrorMessage('Check-out time cannot be earlier than check-in time.');
        return;
      }
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await updateSessionAdmin(session.id, {
        checkIn: new Date(checkInTime).toISOString(),
        checkOut: checkOutTime ? new Date(checkOutTime).toISOString() : undefined,
        task: task.trim() || undefined,
        remarks: remarks.trim() || undefined,
        status: checkOutTime ? 'COMPLETED' : 'ACTIVE',
      });

      showToast('Attendance session updated successfully', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update attendance session.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-session-title"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 id="edit-session-title" className="text-base font-bold text-slate-900 dark:text-white">
                Admin Edit Attendance Session
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Adjust check-in and check-out timestamps for {session.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Member Info Card */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs">
            <div>
              <span className="font-bold text-slate-900 dark:text-white text-sm">{session.name}</span>
              <span className="ml-2 font-mono text-slate-500">{session.registrationNo}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
              Source: {session.source || 'DISCORD'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Check In Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Check-In Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            {/* Check Out Time */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Check-Out Time
                </label>
                {checkOutTime && (
                  <button
                    type="button"
                    onClick={() => setCheckOutTime('')}
                    className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                  >
                    Clear (Set Active)
                  </button>
                )}
              </div>
              <input
                type="datetime-local"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Live Duration Calculation Preview */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Computed Duration:</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {previewDurationMinutes !== null
                ? `${formatMinutesPretty(previewDurationMinutes)} (${previewDurationMinutes} mins)`
                : checkOutTime
                ? 'Invalid time range'
                : 'Session is ongoing (Active)'}
            </span>
          </div>

          {/* Task Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Task Description
            </label>
            <input
              type="text"
              placeholder="e.g. SIH Backend API Development"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          {/* Remarks Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Admin Remarks / Reason for Modification
            </label>
            <input
              type="text"
              placeholder="e.g. Adjusted check-out time per member request"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-colors shadow-xs shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{submitting ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
