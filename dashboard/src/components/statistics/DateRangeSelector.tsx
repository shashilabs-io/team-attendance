import React, { useState } from 'react';
import type { DatePresetKey, DateRange } from '../../utils/datePresets';
import { getDateRangeForPreset } from '../../utils/datePresets';
import { useToast } from '../../context/ToastContext';
import { Calendar, Filter, AlertTriangle } from 'lucide-react';

interface DateRangeSelectorProps {
  currentPreset: DatePresetKey;
  startDate: string;
  endDate: string;
  onRangeChange: (range: DateRange, preset: DatePresetKey) => void;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  currentPreset,
  startDate,
  endDate,
  onRangeChange,
}) => {
  const { showToast } = useToast();
  const [customStart, setCustomStart] = useState<string>(startDate);
  const [customEnd, setCustomEnd] = useState<string>(endDate);
  const [validationError, setValidationError] = useState<string | null>(null);

  const presets: { key: DatePresetKey; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'thisWeek', label: 'This Week' },
    { key: 'last7Days', label: 'Last 7 Days' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'last30Days', label: 'Last 30 Days' },
    { key: 'custom', label: 'Custom Range' },
  ];

  const handlePresetClick = (preset: DatePresetKey) => {
    setValidationError(null);
    if (preset === 'custom') {
      onRangeChange({ startDate: customStart, endDate: customEnd }, 'custom');
    } else {
      const range = getDateRangeForPreset(preset);
      setCustomStart(range.startDate);
      setCustomEnd(range.endDate);
      onRangeChange(range, preset);
      showToast(`Selected period: ${preset}`, 'info');
    }
  };

  const handleApplyCustom = () => {
    if (customStart && customEnd && customStart > customEnd) {
      setValidationError('Start date cannot be after end date.');
      showToast('Invalid date range', 'error');
      return;
    }
    setValidationError(null);
    onRangeChange({ startDate: customStart, endDate: customEnd }, 'custom');
    showToast('Applied custom date range', 'success');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3 transition-colors">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Period Filter</span>
        </div>

        {startDate && endDate && (
          <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg">
            Active: <span className="font-bold text-slate-900 dark:text-slate-100">{startDate}</span> to{' '}
            <span className="font-bold text-slate-900 dark:text-slate-100">{endDate}</span>
          </span>
        )}
      </div>

      {/* Preset Pills */}
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => {
          const isActive = currentPreset === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => handlePresetClick(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-2xs font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Custom Inputs */}
      {currentPreset === 'custom' && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <label htmlFor="custom-start" className="font-semibold text-slate-600 dark:text-slate-300">
                Start:
              </label>
              <input
                id="custom-start"
                type="date"
                value={customStart}
                onChange={(e) => {
                  setCustomStart(e.target.value);
                  setValidationError(null);
                }}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <label htmlFor="custom-end" className="font-semibold text-slate-600 dark:text-slate-300">
                End:
              </label>
              <input
                id="custom-end"
                type="date"
                value={customEnd}
                onChange={(e) => {
                  setCustomEnd(e.target.value);
                  setValidationError(null);
                }}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={handleApplyCustom}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-2xs transition-colors cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              Apply Range
            </button>
          </div>

          {validationError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{validationError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
