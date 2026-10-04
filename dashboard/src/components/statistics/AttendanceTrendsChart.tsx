import React, { useState } from 'react';
import type {
  DailyAnalytics,
  WeeklyAnalytics,
  MonthlyAnalytics,
} from '../../types/api';
import { formatMinutes, formatDate } from '../../utils/formatters';
import { EmptyState } from '../common/EmptyState';
import { TrendingUp, Calendar, Layers } from 'lucide-react';

interface AttendanceTrendsChartProps {
  dailyData: DailyAnalytics[];
  weeklyData: WeeklyAnalytics[];
  monthlyData: MonthlyAnalytics[];
  loading: boolean;
}

export const AttendanceTrendsChart: React.FC<AttendanceTrendsChartProps> = ({
  dailyData,
  weeklyData,
  monthlyData,
  loading,
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const currentDataset =
    activeTab === 'daily'
      ? dailyData.map((d) => ({
          label: formatDate(d.date),
          rawKey: d.date,
          sessions: d.sessions,
          members: d.members,
          totalMinutes: d.totalMinutes,
          averageMinutes: d.averageMinutes,
        }))
      : activeTab === 'weekly'
      ? weeklyData.map((w) => ({
          label: w.week,
          rawKey: w.week,
          sessions: w.sessions,
          members: w.members,
          totalMinutes: w.totalMinutes,
          averageMinutes: w.averageMinutes,
        }))
      : monthlyData.map((m) => ({
          label: m.month,
          rawKey: m.month,
          sessions: m.sessions,
          members: m.members,
          totalMinutes: m.totalMinutes,
          averageMinutes: m.averageMinutes,
        }));

  const maxMinutes = Math.max(...currentDataset.map((item) => item.totalMinutes), 60);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Attendance Trends</h3>
        </div>

        {/* Granularity Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Daily
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('weekly')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              activeTab === 'weekly'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Weekly
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
              activeTab === 'monthly'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {!loading && currentDataset.length === 0 ? (
        <EmptyState
          title="No Trend Data"
          message={`No ${activeTab} attendance recorded in this date range.`}
          icon={<Calendar className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
        />
      ) : (
        <div className="space-y-6">
          {/* Visual Trend Bars */}
          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Logged Work Hours by {activeTab.toUpperCase()}</span>
            </div>

            <div className="space-y-3">
              {currentDataset.map((item) => {
                const percentage = Math.min(
                  100,
                  Math.max(4, Math.round((item.totalMinutes / maxMinutes) * 100))
                );
                return (
                  <div key={item.rawKey} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-800 dark:text-slate-200 font-mono font-semibold">
                        {item.label}
                      </span>
                      <span className="text-slate-900 dark:text-slate-100 font-bold">
                        {formatMinutes(item.totalMinutes)}{' '}
                        <span className="text-slate-500 dark:text-slate-400 font-normal">
                          ({item.sessions} {item.sessions === 1 ? 'session' : 'sessions'}, {item.members} {item.members === 1 ? 'member' : 'members'})
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-blue-600 dark:bg-blue-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="overflow-x-auto custom-scrollbar -mx-5 px-5">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/60">
                  <th scope="col" className="py-3 px-4">Period</th>
                  <th scope="col" className="py-3 px-4">Sessions</th>
                  <th scope="col" className="py-3 px-4">Active Members</th>
                  <th scope="col" className="py-3 px-4">Total Logged</th>
                  <th scope="col" className="py-3 px-4">Average Session</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {currentDataset.map((item) => (
                  <tr key={item.rawKey} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-slate-100">
                      {item.label}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {item.sessions}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{item.members}</td>
                    <td className="py-3 px-4 font-bold text-blue-700 dark:text-blue-400 text-xs">
                      {formatMinutes(item.totalMinutes)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-xs font-mono">
                      {formatMinutes(item.averageMinutes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
