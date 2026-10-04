import React from 'react';
import type { PeriodComparison } from '../../types/api';
import { formatMinutes } from '../../utils/formatters';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PeriodComparisonCardProps {
  comparison: PeriodComparison | null;
  loading: boolean;
}

export const PeriodComparisonCard: React.FC<PeriodComparisonCardProps> = ({
  comparison,
  loading,
}) => {
  if (loading || !comparison) {
    return null;
  }

  const renderBadge = (change: number | null) => {
    if (change === null) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          <Minus className="w-3 h-3" /> New / N/A
        </span>
      );
    }
    if (change > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
          <TrendingUp className="w-3 h-3" /> +{change}%
        </span>
      );
    }
    if (change < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
          <TrendingDown className="w-3 h-3" /> {change}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
        <Minus className="w-3 h-3" /> 0%
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-colors duration-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Period Comparison</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Selected period performance versus preceding timeframe of equal duration
          </p>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
          Benchmark
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Working Hours */}
        <div className="p-4 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Hours
            </span>
            {renderBadge(comparison.changePercentage.totalMinutes)}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {formatMinutes(comparison.current.totalMinutes)}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
              vs {formatMinutes(comparison.previous.totalMinutes)}
            </span>
          </div>
        </div>

        {/* Total Sessions */}
        <div className="p-4 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Sessions
            </span>
            {renderBadge(comparison.changePercentage.sessions)}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {comparison.current.sessions}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
              vs {comparison.previous.sessions}
            </span>
          </div>
        </div>

        {/* Attendance Days */}
        <div className="p-4 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Attendance Days
            </span>
            {renderBadge(comparison.changePercentage.attendanceDays)}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {comparison.current.attendanceDays} days
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
              vs {comparison.previous.attendanceDays} days
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
