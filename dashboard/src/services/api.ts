import type {
  ApiResponse,
  User,
  UserStatus,
  AttendanceSession,
  ActiveMember,
  AttendanceSummary,
  DailyStats,
  MemberStats,
  AttendanceEvent,
  AttendanceQueryParams,
  StatsQueryParams,
  EventQueryParams,
  Pagination,
  OverallAnalytics,
  DailyAnalytics,
  WeeklyAnalytics,
  MonthlyAnalytics,
  MemberPerformance,
  DurationDistribution,
  AttendanceHeatmap,
  PeriodComparison,
} from '../types/api';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://team-attendance-mz2k.onrender.com/api';

/**
 * Standard fetch wrapper handling JSON parsing and error wrapping.
 */
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson.error?.message) {
        errorMessage = errorJson.error.message;
      } else if (errorJson.message) {
        errorMessage = errorJson.message;
      }
    } catch {
      // Fallback to status text
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Check backend API health and connectivity.
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

// ==========================================
// USER API METHODS
// ==========================================

export async function getUsers(): Promise<User[]> {
  const res = await request<ApiResponse<User[]>>('/users');
  return res.data;
}

export async function getUser(id: string): Promise<User> {
  const res = await request<ApiResponse<User>>(`/users/${id}`);
  return res.data;
}

export async function getUserStatus(id: string): Promise<UserStatus> {
  const res = await request<ApiResponse<UserStatus>>(`/users/${id}/status`);
  return res.data;
}

// ==========================================
// ATTENDANCE API METHODS
// ==========================================

export async function getAttendance(
  params?: AttendanceQueryParams
): Promise<{ data: AttendanceSession[]; pagination: Pagination }> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.userId) query.append('userId', params.userId);
  if (params?.registrationNo) query.append('registrationNo', params.registrationNo);
  if (params?.status) query.append('status', params.status);
  if (params?.startDate) query.append('startDate', params.startDate);
  if (params?.endDate) query.append('endDate', params.endDate);

  const queryString = query.toString();
  const endpoint = `/attendance${queryString ? `?${queryString}` : ''}`;
  const res = await request<ApiResponse<AttendanceSession[]>>(endpoint);

  return {
    data: res.data,
    pagination: res.pagination || {
      page: 1,
      limit: 20,
      total: res.data.length,
      totalPages: 1,
    },
  };
}

export async function getAttendanceById(id: string): Promise<AttendanceSession> {
  const res = await request<ApiResponse<AttendanceSession>>(`/attendance/${id}`);
  return res.data;
}

export async function getActiveAttendance(): Promise<ActiveMember[]> {
  const res = await request<ApiResponse<ActiveMember[]>>('/attendance/active');
  return res.data;
}

export async function getTodayAttendance(): Promise<AttendanceSession[]> {
  const res = await request<ApiResponse<AttendanceSession[]>>('/attendance/today');
  return res.data;
}

export async function getAttendanceSummary(): Promise<AttendanceSummary> {
  const res = await request<ApiResponse<AttendanceSummary>>('/attendance/summary');
  return res.data;
}

// ==========================================
// LEGACY STATS API METHODS
// ==========================================

export async function getDailyStats(params?: StatsQueryParams): Promise<DailyStats[]> {
  const query = new URLSearchParams();
  if (params?.startDate) query.append('startDate', params.startDate);
  if (params?.endDate) query.append('endDate', params.endDate);

  const queryString = query.toString();
  const endpoint = `/attendance/stats/daily${queryString ? `?${queryString}` : ''}`;
  const res = await request<ApiResponse<DailyStats[]>>(endpoint);
  return res.data;
}

export async function getMemberStats(params?: StatsQueryParams): Promise<MemberStats[]> {
  const query = new URLSearchParams();
  if (params?.startDate) query.append('startDate', params.startDate);
  if (params?.endDate) query.append('endDate', params.endDate);

  const queryString = query.toString();
  const endpoint = `/attendance/stats/members${queryString ? `?${queryString}` : ''}`;
  const res = await request<ApiResponse<MemberStats[]>>(endpoint);
  return res.data;
}

// ==========================================
// PHASE 7 ADVANCED ANALYTICS API METHODS
// ==========================================

function buildStatsQuery(params?: StatsQueryParams): string {
  const query = new URLSearchParams();
  if (params?.startDate) query.append('startDate', params.startDate);
  if (params?.endDate) query.append('endDate', params.endDate);
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

export async function getOverallAnalytics(params?: StatsQueryParams): Promise<OverallAnalytics> {
  const endpoint = `/attendance/analytics${buildStatsQuery(params)}`;
  const res = await request<ApiResponse<OverallAnalytics>>(endpoint);
  return res.data;
}

export async function getDailyAnalytics(params?: StatsQueryParams): Promise<DailyAnalytics[]> {
  const endpoint = `/attendance/analytics/daily${buildStatsQuery(params)}`;
  const res = await request<ApiResponse<DailyAnalytics[]>>(endpoint);
  return res.data;
}

export async function getWeeklyAnalytics(params?: StatsQueryParams): Promise<WeeklyAnalytics[]> {
  const endpoint = `/attendance/analytics/weekly${buildStatsQuery(params)}`;
  const res = await request<ApiResponse<WeeklyAnalytics[]>>(endpoint);
  return res.data;
}

export async function getMonthlyAnalytics(params?: StatsQueryParams): Promise<MonthlyAnalytics[]> {
  const endpoint = `/attendance/analytics/monthly${buildStatsQuery(params)}`;
  const res = await request<ApiResponse<MonthlyAnalytics[]>>(endpoint);
  return res.data;
}

export async function getMemberPerformance(params?: StatsQueryParams): Promise<MemberPerformance[]> {
  const endpoint = `/attendance/analytics/members${buildStatsQuery(params)}`;
  const res = await request<ApiResponse<MemberPerformance[]>>(endpoint);
  return res.data;
}

export async function getDurationDistribution(params?: StatsQueryParams): Promise<DurationDistribution[]> {
  const endpoint = `/attendance/analytics/distribution${buildStatsQuery(params)}`;
  const res = await request<ApiResponse<DurationDistribution[]>>(endpoint);
  return res.data;
}

export async function getAttendanceHeatmap(params?: StatsQueryParams): Promise<AttendanceHeatmap[]> {
  const endpoint = `/attendance/analytics/heatmap${buildStatsQuery(params)}`;
  const res = await request<ApiResponse<AttendanceHeatmap[]>>(endpoint);
  return res.data;
}

export async function getPeriodComparison(params?: StatsQueryParams): Promise<PeriodComparison> {
  const endpoint = `/attendance/analytics/comparison${buildStatsQuery(params)}`;
  const res = await request<ApiResponse<PeriodComparison>>(endpoint);
  return res.data;
}

// ==========================================
// EVENT AUDIT API METHODS
// ==========================================

export async function getAttendanceEvents(
  params?: EventQueryParams
): Promise<{ data: AttendanceEvent[]; pagination: Pagination }> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.userId) query.append('userId', params.userId);
  if (params?.type) query.append('type', params.type);
  if (params?.startDate) query.append('startDate', params.startDate);
  if (params?.endDate) query.append('endDate', params.endDate);

  const queryString = query.toString();
  const endpoint = `/attendance/events${queryString ? `?${queryString}` : ''}`;
  const res = await request<ApiResponse<AttendanceEvent[]>>(endpoint);

  return {
    data: res.data,
    pagination: res.pagination || {
      page: 1,
      limit: 20,
      total: res.data.length,
      totalPages: 1,
    },
  };
}
