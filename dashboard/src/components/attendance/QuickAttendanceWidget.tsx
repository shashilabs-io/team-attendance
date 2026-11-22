import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { checkIn as apiCheckIn, checkOut as apiCheckOut } from '../../services/api';
import {
  PlayCircle,
  StopCircle,
  Sparkles,
  Shield,
} from 'lucide-react';
import { LoginModal } from '../auth/LoginModal';

interface QuickAttendanceWidgetProps {
  onAttendanceChanged?: () => void;
}

export const QuickAttendanceWidget: React.FC<QuickAttendanceWidgetProps> = ({
  onAttendanceChanged,
}) => {
  const { user, isAuthenticated, userStatus, refreshUserStatus } = useAuth();
  const { showToast } = useToast();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [taskInput, setTaskInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const isCheckedIn = userStatus?.status === 'ACTIVE' && !!userStatus.session;

  // Live stopwatch when checked in
  useEffect(() => {
    if (!isCheckedIn || !userStatus?.session?.checkIn) {
      setElapsedSeconds(0);
      return;
    }

    const checkInTime = new Date(userStatus.session.checkIn).getTime();

    const updateElapsed = () => {
      const now = Date.now();
      const sec = Math.max(0, Math.floor((now - checkInTime) / 1000));
      setElapsedSeconds(sec);
    };

    updateElapsed();
    const timer = setInterval(updateElapsed, 1000);

    return () => clearInterval(timer);
  }, [isCheckedIn, userStatus?.session?.checkIn]);

  const formatElapsed = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiCheckIn({ task: taskInput.trim() || undefined });
      showToast(`🟢 Checked in successfully!`, 'success');
      setTaskInput('');
      await refreshUserStatus();
      if (onAttendanceChanged) onAttendanceChanged();
    } catch (err: any) {
      showToast(err.message || 'Failed to check in.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const res = await apiCheckOut({ task: taskInput.trim() || undefined });
      showToast(
        `🔴 Checked out successfully! Logged ${res.durationMinutes} minutes.`,
        'success'
      );
      setTaskInput('');
      await refreshUserStatus();
      if (onAttendanceChanged) onAttendanceChanged();
    } catch (err: any) {
      showToast(err.message || 'Failed to check out.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // State 1: Public / Unauthenticated
  if (!isAuthenticated || !user) {
    return (
      <>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-purple-600/10 dark:from-blue-900/20 dark:via-indigo-900/10 dark:to-purple-900/20 border border-blue-200/60 dark:border-blue-800/40 p-4 sm:p-5 transition-all">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-600 text-white shadow-xs shadow-blue-500/20 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Direct Web Check In & Check Out
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Team members can authenticate with Discord to record attendance directly from this dashboard.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#5865F2] hover:bg-[#4752C4] active:bg-[#3c45a5] transition-colors shadow-xs shadow-[#5865F2]/20 shrink-0 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 127.14 96.36">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.87,53,48.83,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.11,53,91.08,65.69,84.69,65.69Z" />
              </svg>
              <span>Sign In with Discord</span>
            </button>
          </div>
        </div>

        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={() => {
            if (onAttendanceChanged) onAttendanceChanged();
          }}
        />
      </>
    );
  }

  // State 2: Authenticated Member
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all p-4 sm:p-5 ${
        isCheckedIn
          ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
      }`}
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: User Identity & Active Status */}
        <div className="flex items-center gap-3.5">
          <div
            className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 font-bold text-white shadow-xs ${
              isCheckedIn ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-slate-700 dark:bg-slate-800 text-slate-300'
            }`}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {user.name}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {user.registrationNo}
              </span>
              {user.role === 'ADMIN' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                  <Shield className="w-3 h-3" />
                  Admin
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                  isCheckedIn ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isCheckedIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
                {isCheckedIn ? 'Checked In' : 'Currently Offline'}
              </span>

              {isCheckedIn && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                    ⏱ {formatElapsed(elapsedSeconds)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {isCheckedIn ? (
            <>
              {userStatus?.session?.task && (
                <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 truncate max-w-xs">
                  <span className="font-semibold text-slate-400 mr-1.5">Task:</span>
                  {userStatus.session.task}
                </div>
              )}
              <button
                type="button"
                onClick={handleCheckOut}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 transition-colors shadow-xs shadow-rose-500/20 disabled:opacity-50 cursor-pointer"
              >
                <StopCircle className="w-4 h-4" />
                <span>{loading ? 'Checking Out...' : 'Check Out'}</span>
              </button>
            </>
          ) : (
            <form onSubmit={handleCheckIn} className="flex flex-col sm:flex-row items-stretch gap-2 w-full lg:w-auto">
              <input
                type="text"
                placeholder="What are you working on? (Optional)"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                className="w-full sm:w-64 px-3.5 py-2 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-xs shadow-emerald-500/20 disabled:opacity-50 shrink-0 cursor-pointer"
              >
                <PlayCircle className="w-4 h-4" />
                <span>{loading ? 'Checking In...' : 'Check In'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
