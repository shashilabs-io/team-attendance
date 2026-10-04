/**
 * Date and Timezone utilities configured for Indian Standard Time (IST: UTC+5:30).
 * Consistent server-side timezone strategy for day boundaries without modifying UTC timestamps.
 */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +05:30 in milliseconds
/**
 * Returns UTC Date objects for start of today (00:00:00.000 IST) and start of tomorrow (00:00:00.000 IST).
 */
export function getTodayRange(referenceDate = new Date()) {
    // Convert reference UTC date to IST date components
    const istTime = new Date(referenceDate.getTime() + IST_OFFSET_MS);
    const year = istTime.getUTCFullYear();
    const month = istTime.getUTCMonth();
    const day = istTime.getUTCDate();
    // Start of day in IST converted back to UTC
    const startOfTodayMs = Date.UTC(year, month, day) - IST_OFFSET_MS;
    const startOfTomorrowMs = startOfTodayMs + 24 * 60 * 60 * 1000;
    return {
        startOfToday: new Date(startOfTodayMs),
        startOfTomorrow: new Date(startOfTomorrowMs),
    };
}
/**
 * Parses optional startDate and endDate strings (format YYYY-MM-DD or ISO) into UTC boundaries.
 * startDate is inclusive from 00:00:00.000 IST.
 * endDate is inclusive up to 23:59:59.999 IST (exclusive start of next day).
 */
export function parseDateRange(startDateStr, endDateStr) {
    let startDate;
    let endDate;
    if (startDateStr) {
        const parts = startDateStr.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            startDate = new Date(Date.UTC(year, month, day) - IST_OFFSET_MS);
        }
        else {
            const parsed = new Date(startDateStr);
            if (!isNaN(parsed.getTime())) {
                startDate = parsed;
            }
        }
    }
    if (endDateStr) {
        const parts = endDateStr.split('-');
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            // Next day start in IST (boundary)
            endDate = new Date(Date.UTC(year, month, day + 1) - IST_OFFSET_MS);
        }
        else {
            const parsed = new Date(endDateStr);
            if (!isNaN(parsed.getTime())) {
                endDate = parsed;
            }
        }
    }
    return { startDate, endDate };
}
/**
 * Formats a UTC Date to "YYYY-MM-DD" string in IST.
 */
export function formatDateToISTString(date) {
    const istTime = new Date(date.getTime() + IST_OFFSET_MS);
    const year = istTime.getUTCFullYear();
    const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istTime.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
