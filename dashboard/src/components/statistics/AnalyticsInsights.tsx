import React from 'react';
import type {
  OverallAnalytics,
  DailyAnalytics,
  MemberPerformance,
} from '../../types/api';
import { formatMinutes, formatDate } from '../../utils/formatters';
import { Lightbulb, Award, Calendar, Clock, Sparkles } from 'lucide-react';

interface AnalyticsInsightsProps {
  overall: OverallAnalytics | null;
  dailyData: DailyAnalytics[];
  members: MemberPerformance[];
  loading: boolean;
}

export const AnalyticsInsights: React.FC<AnalyticsInsightsProps> = ({
  overall,
  dailyData,
  members,
  loading,
}) => {
  if (loading || !overall) {
    return null;
  }

  // 1. Most active member
  const mostActive = members.length > 0 ? members[0] : null;

  // 2. Most consistent member (max attendanceDays)
  const mostConsistent =
    members.length > 0
      ? [...members].sort((a, b) => b.attendanceDays - a.attendanceDays)[0]
      : null;

  // 3. Highest attendance day
  const highestDay =
    dailyData.length > 0
      ? [...dailyData].sort((a, b) => b.totalMinutes - a.totalMinutes)[0]
      : null;

  // 4. Average sessions per day
  const avgSessionsPerDay =
    dailyData.length > 0
      ? (overall.totalSessions / dailyData.length).toFixed(1)
      : '0';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Key Attendance Insights</h3>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
          Automated Analysis
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Most Active Member */}
        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
            <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Most Active Member
            </span>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {mostActive ? mostActive.name : 'N/A'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {mostActive
                ? `${formatMinutes(mostActive.totalMinutes)} logged`
                : 'No attendance'}
            </div>
          </div>
        </div>

        {/* Most Consistent Member */}
        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Most Consistent
            </span>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {mostConsistent ? mostConsistent.name : 'N/A'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {mostConsistent
                ? `${mostConsistent.attendanceDays} distinct days attended`
                : 'No attendance'}
            </div>
          </div>
        </div>

        {/* Peak Activity Day */}
        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Highest Day
            </span>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {highestDay ? formatDate(highestDay.date) : 'N/A'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {highestDay
                ? `${formatMinutes(highestDay.totalMinutes)} (${highestDay.sessions} sessions)`
                : 'No activity'}
            </div>
          </div>
        </div>

        {/* Average Daily Velocity */}
        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Avg Sessions / Day
            </span>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {avgSessionsPerDay} sessions
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Across {dailyData.length} active recorded days
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
