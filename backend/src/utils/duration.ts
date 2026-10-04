import { AppError } from './AppError.js';

/**
 * Calculates duration in whole minutes between checkIn and checkOut.
 *
 * Rules:
 * - Result must never be negative.
 * - Round down to whole minutes.
 * - If checkOut < checkIn, throw an appropriate error.
 * - Do not calculate duration using local timezone strings. Use Date timestamps.
 */
export function calculateDurationMinutes(checkIn: Date, checkOut: Date): number {
  const checkInTime = checkIn.getTime();
  const checkOutTime = checkOut.getTime();

  if (isNaN(checkInTime) || isNaN(checkOutTime)) {
    throw new AppError(
      'INVALID_DURATION',
      'Invalid date provided for duration calculation'
    );
  }

  if (checkOutTime < checkInTime) {
    throw new AppError(
      'INVALID_DURATION',
      'Check-out timestamp cannot be earlier than check-in timestamp'
    );
  }

  const diffMs = checkOutTime - checkInTime;
  const minutes = Math.floor(diffMs / 60000);

  return Math.max(0, minutes);
}

/**
 * Formats duration into human-readable string: e.g. "1h 30m" or "45m"
 */
export function formatDuration(durationMinutes: number): string {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 0) {
    return `${minutes}m`;
  }
  return `${hours}h ${minutes}m`;
}
