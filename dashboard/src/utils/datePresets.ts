/**
 * Generates ISO/IST formatted 'YYYY-MM-DD' strings for preset date ranges.
 */

function formatYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export type DatePresetKey =
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'last7Days'
  | 'thisMonth'
  | 'last30Days'
  | 'custom';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export function getDateRangeForPreset(preset: DatePresetKey): DateRange {
  const now = new Date();

  switch (preset) {
    case 'today': {
      const todayStr = formatYMD(now);
      return { startDate: todayStr, endDate: todayStr };
    }
    case 'yesterday': {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const yStr = formatYMD(yesterday);
      return { startDate: yStr, endDate: yStr };
    }
    case 'thisWeek': {
      // Monday of current week
      const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
      const diffToMonday = (dayOfWeek + 6) % 7;
      const monday = new Date(now.getTime() - diffToMonday * 24 * 60 * 60 * 1000);
      return { startDate: formatYMD(monday), endDate: formatYMD(now) };
    }
    case 'last7Days': {
      const sevenDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      return { startDate: formatYMD(sevenDaysAgo), endDate: formatYMD(now) };
    }
    case 'thisMonth': {
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: formatYMD(firstOfMonth), endDate: formatYMD(now) };
    }
    case 'last30Days': {
      const thirtyDaysAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
      return { startDate: formatYMD(thirtyDaysAgo), endDate: formatYMD(now) };
    }
    case 'custom':
    default:
      return { startDate: '', endDate: '' };
  }
}
