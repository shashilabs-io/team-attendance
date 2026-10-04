export type UserRole = 'MEMBER' | 'ADMIN';

export type AttendanceSessionStatus = 'ACTIVE' | 'COMPLETED';

export type AttendanceEventType = 'CHECK_IN' | 'CHECK_OUT';

export type AttendanceSource = 'DISCORD' | 'GOOGLE_FORM';

export const USER_ROLES: readonly UserRole[] = ['MEMBER', 'ADMIN'] as const;

export const ATTENDANCE_SESSION_STATUSES: readonly AttendanceSessionStatus[] = [
  'ACTIVE',
  'COMPLETED',
] as const;

export const ATTENDANCE_EVENT_TYPES: readonly AttendanceEventType[] = [
  'CHECK_IN',
  'CHECK_OUT',
] as const;

export const ATTENDANCE_SOURCES: readonly AttendanceSource[] = [
  'DISCORD',
  'GOOGLE_FORM',
] as const;
