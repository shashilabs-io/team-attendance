import React, { useState, useEffect } from 'react';
import {
  getOverallAnalytics,
  getDailyAnalytics,
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getMemberPerformance,
  getDurationDistribution,
  getAttendanceHeatmap,
  getPeriodComparison,
} from '../services/api';
import type {
  OverallAnalytics,
  DailyAnalytics,
  WeeklyAnalytics,
  MonthlyAnalytics,
  MemberPerformance,
  DurationDistribution,
  AttendanceHeatmap,
  PeriodComparison,
} from '../types/api';
import { formatMinutes } from '../utils/formatters';
import type { DatePresetKey, DateRange } from '../utils/datePresets';
import { getDateRangeForPreset } from '../utils/datePresets';
import { DateRangeSelector } from '../components/statistics/DateRangeSelector';
import { PeriodComparisonCard } from '../components/statistics/PeriodComparisonCard';
import { AttendanceTrendsChart } from '../components/statistics/AttendanceTrendsChart';
import { MemberPerformanceSection } from '../components/statistics/MemberPerformanceSection';
import { DurationDistributionChart } from '../components/statistics/DurationDistributionChart';
import { AttendanceHeatmapCard } from '../components/statistics/AttendanceHeatmapCard';
import { AnalyticsInsights } from '../components/statistics/AnalyticsInsights';
import { StatCard } from '../components/dashboard/StatCard';
import { CardSkeleton, ChartSkeleton, TableSkeleton } from '../components/common/Skeleton';
import { ErrorState } from '../components/common/ErrorState';
import { useToast } from '../context/ToastContext';
import {
  Activity,
  Clock,
  CalendarCheck,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';

export const Statistics: React.FC = () => {
  const { addToast } = useToast();

  // Preset defaults to 'thisMonth'
  const defaultPreset: DatePresetKey = 'thisMonth';
  const defaultRange = getDateRangeForPreset(defaultPreset);

  const [currentPreset, setCurrentPreset] = useState<DatePresetKey>(defaultPreset);
  const [startDate, setStartDate] = useState<string>(defaultRange.startDate);
  const [endDate, setEndDate] = useState<string>(defaultRange.endDate);

  // Analytics states
  const [overall, setOverall] = useState<OverallAnalytics | null>(null);
  const [dailyData, setDailyData] = useState<DailyAnalytics[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyAnalytics[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyAnalytics[]>([]);
  const [members, setMembers] = useState<MemberPerformance[]>([]);
  const [distribution, setDistribution] = useState<DurationDistribution[]>([]);
  const [heatmapData, setHeatmapData] = useState<AttendanceHeatmap[]>([]);
  const [comparison, setComparison] = useState<PeriodComparison | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleRangeChange = (range: DateRange, preset: DatePresetKey) => {
    setCurrentPreset(preset);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  const handleRetry = () => {
    setRefreshing(true);
    fetchAnalyticsData(startDate, endDate, true);
  };

  const fetchAnalyticsData = (start?: string, end?: string, showToast = false) => {
    const params = {
      startDate: start || undefined,
      endDate: end || undefined,
    };

    Promise.all([
      getOverallAnalytics(params),
      getDailyAnalytics(params),
      getWeeklyAnalytics(params),
      getMonthlyAnalytics(params),
      getMemberPerformance(params),
      getDurationDistribution(params),
      getAttendanceHeatmap(params),
      getPeriodComparison(params),
    ])
      .then(
        ([
          overallRes,
          dailyRes,
          weeklyRes,
          monthlyRes,
          membersRes,
          distRes,
          heatmapRes,
          comparisonRes,
        ]) => {
          setOverall(overallRes);
          setDailyData(dailyRes);
          setWeeklyData(weeklyRes);
          setMonthlyData(monthlyRes);
          setMembers(membersRes);
          setDistribution(distRes);
          setHeatmapData(heatmapRes);
          setComparison(comparisonRes);
          setError(null);
          if (showToast) {
            addToast('Analytics refreshed successfully', 'success');
          }
        }
      )
      .catch((err: any) => {
        console.error('Failed to load advanced analytics:', err);
        const msg = err.message || 'Unable to retrieve advanced analytics data.';
        setError(msg);
        addToast(msg, 'error');
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    let isMounted = true;

    const params = {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };

    Promise.all([
      getOverallAnalytics(params),
      getDailyAnalytics(params),
      getWeeklyAnalytics(params),
      getMonthlyAnalytics(params),
      getMemberPerformance(params),
      getDurationDistribution(params),
      getAttendanceHeatmap(params),
      getPeriodComparison(params),
    ])
      .then(
        ([
          overallRes,
          dailyRes,
          weeklyRes,
          monthlyRes,
          membersRes,
          distRes,
          heatmapRes,
          comparisonRes,
        ]) => {
          if (isMounted) {
            setOverall(overallRes);
            setDailyData(dailyRes);
            setWeeklyData(weeklyRes);
            setMonthlyData(monthlyRes);
            setMembers(membersRes);
            setDistribution(distRes);
            setHeatmapData(heatmapRes);
            setComparison(comparisonRes);
            setError(null);
          }
        }
      )
      .catch((err: any) => {
        if (isMounted) {
          setError(err.message || 'Unable to retrieve advanced analytics data.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [startDate, endDate]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Advanced Analytics & Reporting
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time multi-dimensional presence metrics, productivity trends, and member insights.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRetry}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Recalculating...' : 'Refresh Analytics'}
        </button>
      </div>

      {/* Date Range Selector Toolbar */}
      <DateRangeSelector
        currentPreset={currentPreset}
        startDate={startDate}
        endDate={endDate}
        onRangeChange={handleRangeChange}
      />

      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardSkeleton count={4} />
          </div>
          <ChartSkeleton height="h-64" />
          <ChartSkeleton height="h-72" />
          <TableSkeleton rows={4} columns={6} />
        </div>
      )}

      {error && !loading && (
        <ErrorState
          title="Failed to generate analytics"
          message={error}
          onRetry={handleRetry}
        />
      )}

      {!loading && !error && (
        <div className="space-y-6">
          {/* 1. OVERVIEW STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Sessions"
              value={overall?.totalSessions ?? 0}
              subtitle="All sessions in period"
              icon={Activity}
              colorScheme="blue"
            />

            <StatCard
              title="Total Hours"
              value={formatMinutes(overall?.totalMinutes)}
              subtitle="Completed working duration"
              icon={Clock}
              colorScheme="amber"
            />

            <StatCard
              title="Average Session"
              value={formatMinutes(overall?.averageSessionMinutes)}
              subtitle="Mean focused stretch"
              icon={CheckCircle}
              colorScheme="green"
            />

            <StatCard
              title="Attendance Days"
              value={
                comparison ? `${comparison.current.attendanceDays} days` : '0 days'
              }
              subtitle="Distinct days with activity"
              icon={CalendarCheck}
              colorScheme="purple"
            />
          </div>

          {/* 2. PERIOD COMPARISON */}
          <PeriodComparisonCard comparison={comparison} loading={loading} />

          {/* 3. AUTOMATED INSIGHTS */}
          <AnalyticsInsights
            overall={overall}
            dailyData={dailyData}
            members={members}
            loading={loading}
          />

          {/* 4. ATTENDANCE TRENDS (DAILY / WEEKLY / MONTHLY) */}
          <AttendanceTrendsChart
            dailyData={dailyData}
            weeklyData={weeklyData}
            monthlyData={monthlyData}
            loading={loading}
          />

          {/* 5. MEMBER PERFORMANCE & RANKINGS */}
          <MemberPerformanceSection members={members} loading={loading} />

          {/* 6. DURATION ANALYSIS & DISTRIBUTION */}
          <DurationDistributionChart
            distribution={distribution}
            averageMinutes={overall?.averageSessionMinutes ?? 0}
            longestMinutes={overall?.longestSessionMinutes ?? 0}
            shortestMinutes={overall?.shortestSessionMinutes ?? 0}
            loading={loading}
          />

          {/* 7. ATTENDANCE HEATMAP */}
          <AttendanceHeatmapCard heatmapData={heatmapData} loading={loading} />
        </div>
      )}
    </div>
  );
};
