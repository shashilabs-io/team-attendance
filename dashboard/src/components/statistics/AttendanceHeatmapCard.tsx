import React from 'react';
import type { AttendanceHeatmap } from '../../types/api';
import { formatMinutes, formatDate } from '../../utils/formatters';
import { EmptyState } from '../common/EmptyState';
import { Grid, Calendar } from 'lucide-react';

interface AttendanceHeatmapCardProps {
  heatmapData: AttendanceHeatmap[];
  loading: boolean;
}

export const AttendanceHeatmapCard: React.FC<AttendanceHeatmapCardProps> = ({
  heatmapData,
  loading,
}) => {
  if (!loading && heatmapData.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-colors duration-200">
        <div className="flex items-center gap-2 mb-4">
          <Grid className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Attendance Intensity Heatmap</h3>
        </div>
        <EmptyState message="No attendance data to plot on heatmap for this period." />
      </div>
    );
  }

  // Level selector based on logged minutes
  const getIntensityColor = (minutes: number) => {
    if (minutes <= 0) return 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700/60';
    if (minutes < 60) return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
    if (minutes < 180) return 'bg-emerald-300 dark:bg-emerald-800/70 text-emerald-950 dark:text-emerald-100 border-emerald-400 dark:border-emerald-700/70';
    if (minutes < 300) return 'bg-emerald-500 dark:bg-emerald-600 text-white border-emerald-600 dark:border-emerald-500 font-semibold';
    return 'bg-emerald-700 dark:bg-emerald-500 text-white border-emerald-800 dark:border-emerald-400 font-bold';
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Grid className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Attendance Intensity Heatmap</h3>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span>Less</span>
          <span className="w-3 h-3 rounded-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" title="0m" />
          <span className="w-3 h-3 rounded-xs bg-emerald-100 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800" title="<1h" />
          <span className="w-3 h-3 rounded-xs bg-emerald-300 dark:bg-emerald-800 border border-emerald-400 dark:border-emerald-700" title="1-3h" />
          <span className="w-3 h-3 rounded-xs bg-emerald-500 dark:bg-emerald-600 border border-emerald-600 dark:border-emerald-500" title="3-5h" />
          <span className="w-3 h-3 rounded-xs bg-emerald-700 dark:bg-emerald-500 border border-emerald-800 dark:border-emerald-400" title="5h+" />
          <span>More</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 pt-2">
        {heatmapData.map((day) => {
          const colorClass = getIntensityColor(day.minutes);

          return (
            <div
              key={day.date}
              className={`p-3 rounded-lg border flex flex-col justify-between transition-all hover:scale-102 hover:shadow-xs ${colorClass}`}
              title={`${formatDate(day.date)}: ${day.sessions} sessions, ${formatMinutes(day.minutes)}`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-mono text-[11px] opacity-80">{day.date.slice(5)}</span>
                <Calendar className="w-3 h-3 opacity-70" />
              </div>
              <div>
                <div className="text-sm font-bold truncate">
                  {formatMinutes(day.minutes)}
                </div>
                <div className="text-[10px] opacity-80 mt-0.5">
                  {day.sessions} {day.sessions === 1 ? 'session' : 'sessions'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
