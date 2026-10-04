/**
 * Formats a duration in minutes into a human-readable 'Xh Ym' or 'Ym' string.
 * Example: 1240 minutes -> '20h 40m'
 */
export function formatMinutes(totalMinutes?: number | null): string {
  if (totalMinutes === undefined || totalMinutes === null || isNaN(totalMinutes)) {
    return '0m';
  }
  const minutes = Math.max(0, Math.floor(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;

  if (hours === 0) {
    return `${remainingMins}m`;
  }
  if (remainingMins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMins}m`;
}

/**
 * Calculates and formats elapsed time from an ISO timestamp string to now.
 */
export function formatElapsedTime(checkInTimestamp: string): string {
  const checkInDate = new Date(checkInTimestamp);
  if (isNaN(checkInDate.getTime())) {
    return '0m';
  }
  const diffMs = Math.max(0, Date.now() - checkInDate.getTime());
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  return formatMinutes(diffMinutes);
}

/**
 * Formats a date string into Indian standard display: 'DD MMM YYYY'
 * Example: '04 Oct 2026'
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';

  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

/**
 * Formats a time string into 12-hour format: 'hh:mm A'
 * Example: '09:36 AM'
 */
export function formatTime(dateString?: string | null): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';

  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}

/**
 * Formats a date string into 'DD MMM YYYY, hh:mm A'
 */
export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';

  return `${formatDate(dateString)}, ${formatTime(dateString)}`;
}

/**
 * Formats an ISO date into relative readable time string (e.g. 'Just now', '2m ago', '1h ago', 'Yesterday')
 */
export function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 30) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(dateString);
}

/**
 * Copies a string to the user's clipboard safely.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  } catch (err) {
    console.warn('Clipboard write failed:', err);
    return false;
  }
}

