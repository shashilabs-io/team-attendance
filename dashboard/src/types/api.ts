/**
 * Generic API response envelope matching backend Express responses.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: Pagination;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface User {
  id: string;
  name: string;
  registrationNo: string;
  discordUserId: string;
  role: 'MEMBER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserStatus {
  user: {
    id: string;
    name: string;
    registrationNo: string;
  };
  status: 'ACTIVE' | 'OFFLINE';
  session: {
    id: string;
    checkIn: string;
    task?: string;
  } | null;
}

export interface AttendanceSession {
  id: string;
  userId: string;
  discordUserId: string;
  name: string;
  registrationNo: string;
  checkIn: string;
  checkOut?: string;
  task?: string;
  remarks?: string;
  source?: 'DISCORD' | 'GOOGLE_FORM' | string;
  durationMinutes?: number;
  status: 'ACTIVE' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}

export interface ActiveMember {
  name: string;
  registrationNo: string;
  checkIn: string;
  task: string;
  source?: 'DISCORD' | 'GOOGLE_FORM' | string;
  durationMinutes: number;
}

export interface AttendanceSummary {
  totalMembers: number;
  activeNow: number;
  checkedInToday: number;
  completedToday: number;
  totalMinutesToday: number;
}

export interface DailyStats {
  date: string;
  sessions: number;
  members: number;
  totalMinutes: number;
  averageMinutes: number;
}

export interface MemberStats {
  userId: string;
  name: string;
  registrationNo: string;
  sessions: number;
  totalMinutes: number;
  averageMinutes: number;
}

export interface AttendanceEvent {
  eventId: string;
  userId: string;
  discordUserId: string;
  registrationNo: string;
  type: 'CHECK_IN' | 'CHECK_OUT';
  sessionId: string;
  timestamp: string;
  task?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ==========================================
// PHASE 7 ANALYTICS TYPES
// ==========================================

export interface OverallAnalytics {
  totalSessions: number;
  totalMembers: number;
  activeSessions: number;
  completedSessions: number;
  totalMinutes: number;
  averageSessionMinutes: number;
  longestSessionMinutes: number;
  shortestSessionMinutes: number;
}

export interface DailyAnalytics {
  date: string;
  sessions: number;
  members: number;
  totalMinutes: number;
  averageMinutes: number;
}

export interface WeeklyAnalytics {
  week: string;
  sessions: number;
  members: number;
  totalMinutes: number;
  averageMinutes: number;
}

export interface MonthlyAnalytics {
  month: string;
  sessions: number;
  members: number;
  totalMinutes: number;
  averageMinutes: number;
}

export interface MemberPerformance {
  userId: string;
  name: string;
  registrationNo: string;
  sessions: number;
  totalMinutes: number;
  averageMinutes: number;
  completedSessions: number;
  attendanceDays: number;
}

export interface DurationDistribution {
  range: string;
  sessions: number;
}

export interface AttendanceHeatmap {
  date: string;
  minutes: number;
  sessions: number;
}

export interface PeriodMetrics {
  totalHours: number;
  totalMinutes: number;
  sessions: number;
  attendanceDays: number;
}

export interface PeriodComparison {
  current: PeriodMetrics;
  previous: PeriodMetrics;
  changePercentage: {
    totalMinutes: number | null;
    sessions: number | null;
    attendanceDays: number | null;
  };
}

export interface AttendanceQueryParams {
  page?: number;
  limit?: number;
  userId?: string;
  registrationNo?: string;
  status?: 'ACTIVE' | 'COMPLETED';
  startDate?: string;
  endDate?: string;
}

export interface StatsQueryParams {
  startDate?: string;
  endDate?: string;
}

export interface EventQueryParams {
  page?: number;
  limit?: number;
  userId?: string;
  type?: 'CHECK_IN' | 'CHECK_OUT';
  startDate?: string;
  endDate?: string;
}
