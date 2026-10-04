import React from 'react';
import type { DurationDistribution } from '../../types/api';
import { formatMinutes } from '../../utils/formatters';
import { Clock, PieChart, Timer, Zap } from 'lucide-react';

interface DurationDistributionChartProps {
  distribution: DurationDistribution[];
  averageMinutes: number;
  longestMinutes: number;
  shortestMinutes: number;
  loading: boolean;
}

export const DurationDistributionChart: React.FC<DurationDistributionChartProps> = ({
  distribution,
  averageMinutes,
  longestMinutes,
  shortestMinutes,
  loading,
}) => {
  const totalSessions = distribution.reduce((sum, item) => sum + item.sessions, 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-6 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieChart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Session Duration & Distribution
          </h3>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
          Completed Sessions
        </span>
      </div>

      {/* Duration Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Average Duration */}
        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Average Session
            </span>
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {loading ? '-' : formatMinutes(averageMinutes)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Mean completed session length</p>
        </div>

        {/* Longest Duration */}
        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Longest Session
            </span>
            <Timer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {loading ? '-' : formatMinutes(longestMinutes)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Peak focused work stretch</p>
        </div>

        {/* Shortest Duration */}
        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Shortest Session
            </span>
            <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {loading ? '-' : formatMinutes(shortestMinutes)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Quickest recorded session</p>
        </div>
      </div>

      {/* Distribution Buckets Bar Visualization */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Session Duration Breakdown
        </h4>

        <div className="space-y-2.5">
          {distribution.map((bucket) => {
            const percentage =
              totalSessions > 0
                ? Math.round((bucket.sessions / totalSessions) * 100)
                : 0;

            return (
              <div key={bucket.range} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">{bucket.range}</span>
                  <span className="text-slate-900 dark:text-slate-100 font-bold">
                    {bucket.sessions}{' '}
                    <span className="text-slate-500 dark:text-slate-400 font-normal">
                      ({percentage}%)
                    </span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(percentage > 0 ? 4 : 0, percentage)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
