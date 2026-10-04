import React, { useEffect, useState, useCallback } from 'react';
import {
  getAttendanceSummary,
  getActiveAttendance,
  getTodayAttendance,
  getAttendanceEvents,
  getUsers,
} from '../services/api';
import type {
  AttendanceSummary,
  ActiveMember,
  AttendanceSession,
  AttendanceEvent,
} from '../types/api';
import { formatMinutes } from '../utils/formatters';
import { StatCard } from '../components/dashboard/StatCard';
import { ActiveMembers } from '../components/dashboard/ActiveMembers';
import { TodayAttendance } from '../components/dashboard/TodayAttendance';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { ErrorState } from '../components/common/ErrorState';
import { CardSkeleton } from '../components/common/Skeleton';
import { useToast } from '../context/ToastContext';
import {
  Users,
  Radio,
  UserCheck,
  CheckCircle,
  Clock,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { showToast } = useToast();
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [activeMembers, setActiveMembers] = useState<ActiveMember[]>([]);
  const [todaySessions, setTodaySessions] = useState<AttendanceSession[]>([]);
  const [events, setEvents] = useState<AttendanceEvent[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all dashboard data concurrently
  const loadDashboardData = useCallback((isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    Promise.all([
      getAttendanceSummary(),
      getActiveAttendance(),
      getTodayAttendance(),
      getAttendanceEvents({ limit: 10 }),
      getUsers().catch(() => []),
    ])
      .then(([summaryRes, activeRes, todayRes, eventsRes, usersRes]) => {
        setSummary(summaryRes);
        setActiveMembers(activeRes);
        setTodaySessions(todayRes);
        setEvents(eventsRes.data);

        const mapping: Record<string, string> = {};
        usersRes.forEach((u) => {
          mapping[u.registrationNo] = u.name;
        });
        setUserMap(mapping);
        setError(null);
        if (isSilent) {
          showToast('Overview data refreshed', 'success');
        }
      })
      .catch((err: any) => {
        console.error('Failed to load dashboard data:', err);
        setError(err.message || 'Unable to connect to backend attendance service.');
        showToast('Failed to refresh data', 'error');
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [showToast]);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      getAttendanceSummary(),
      getActiveAttendance(),
      getTodayAttendance(),
      getAttendanceEvents({ limit: 10 }),
      getUsers().catch(() => []),
    ])
      .then(([summaryRes, activeRes, todayRes, eventsRes, usersRes]) => {
        if (isMounted) {
          setSummary(summaryRes);
          setActiveMembers(activeRes);
          setTodaySessions(todayRes);
          setEvents(eventsRes.data);

          const mapping: Record<string, string> = {};
          usersRes.forEach((u) => {
            mapping[u.registrationNo] = u.name;
          });
          setUserMap(mapping);
          setError(null);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          console.error('Failed to load dashboard data:', err);
          setError(err.message || 'Unable to connect to backend attendance service.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    // Auto-refresh summary and active lists every 30 seconds
    const interval = setInterval(() => {
      if (isMounted) {
        loadDashboardData(true);
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [loadDashboardData]);

  // Calculate most active member today from today's sessions
  const memberTodayMinutes: Record<string, { name: string; minutes: number }> = {};
  todaySessions.forEach((s) => {
    if (s.name) {
      if (!memberTodayMinutes[s.name]) {
        memberTodayMinutes[s.name] = { name: s.name, minutes: 0 };
      }
      memberTodayMinutes[s.name].minutes += s.durationMinutes || 0;
    }
  });
  const mostActiveToday = Object.values(memberTodayMinutes).sort(
    (a, b) => b.minutes - a.minutes
  )[0];

  if (error && !summary) {
    return (
      <div className="py-8">
        <ErrorState
          title="Dashboard Unavailable"
          message={error}
          onRetry={() => loadDashboardData()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Refresh Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Dashboard Overview
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time team presence, productive hours, and audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadDashboardData(true)}
            disabled={refreshing || loading}
            aria-label="Refresh dashboard data"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Today Quick Insights Strip */}
      {mostActiveToday && mostActiveToday.minutes > 0 && (
        <div className="bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-2 text-xs transition-colors">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="font-bold text-amber-900 dark:text-amber-200">
              Most Active Today:
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {mostActiveToday.name}
            </span>
            <span className="text-amber-800 dark:text-amber-300">
              ({formatMinutes(mostActiveToday.minutes)} logged across sessions today)
            </span>
          </div>
          <span className="text-slate-500 dark:text-slate-400 font-medium">
            {todaySessions.length} total sessions today
          </span>
        </div>
      )}

      {/* 5 Summary Stat Cards */}
      {loading && !summary ? (
        <CardSkeleton count={5} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Members"
            value={summary?.totalMembers ?? 0}
            subtitle="Registered roster"
            icon={Users}
            colorScheme="blue"
          />

          <StatCard
            title="Active Now"
            value={summary?.activeNow ?? 0}
            subtitle="Currently working"
            icon={Radio}
            colorScheme="green"
            badge={summary?.activeNow ? 'Live' : undefined}
          />

          <StatCard
            title="Checked In Today"
            value={summary?.checkedInToday ?? 0}
            subtitle="Unique members"
            icon={UserCheck}
            colorScheme="purple"
          />

          <StatCard
            title="Completed Today"
            value={summary?.completedToday ?? 0}
            subtitle="Finished sessions"
            icon={CheckCircle}
            colorScheme="slate"
          />

          <StatCard
            title="Total Hours Today"
            value={formatMinutes(summary?.totalMinutesToday)}
            subtitle="Productive work"
            icon={Clock}
            colorScheme="amber"
          />
        </div>
      )}

      {/* Live Active Members Section */}
      <ActiveMembers
        members={activeMembers}
        loading={loading && activeMembers.length === 0}
        error={error}
        onRetry={() => loadDashboardData()}
      />

      {/* Today's Attendance Table */}
      <TodayAttendance
        sessions={todaySessions}
        loading={loading && todaySessions.length === 0}
        error={error}
        onRetry={() => loadDashboardData()}
      />

      {/* Recent Activity Audit */}
      <RecentActivity
        events={events}
        userMap={userMap}
        loading={loading && events.length === 0}
        error={error}
        onRetry={() => loadDashboardData()}
      />
    </div>
  );
};
