import { AttendanceSession } from '../models/AttendanceSession.js';
import { parseDateRange } from '../utils/dateUtils.js';
/**
 * Builds a Mongo date match condition from startDate and endDate strings in IST.
 */
function buildDateMatch(startDateStr, endDateStr) {
    const match = {};
    const { startDate, endDate } = parseDateRange(startDateStr, endDateStr);
    if (startDate || endDate) {
        match.checkIn = {};
        if (startDate)
            match.checkIn.$gte = startDate;
        if (endDate)
            match.checkIn.$lt = endDate;
    }
    return match;
}
/**
 * 1. GET /api/attendance/analytics
 * Returns high-level overall analytics for the selected period.
 */
export async function getOverallAnalytics(startDateStr, endDateStr) {
    const match = buildDateMatch(startDateStr, endDateStr);
    const pipeline = [
        ...(Object.keys(match).length > 0 ? [{ $match: match }] : []),
        {
            $group: {
                _id: null,
                totalSessions: { $sum: 1 },
                membersSet: { $addToSet: '$registrationNo' },
                activeSessions: {
                    $sum: { $cond: [{ $eq: ['$status', 'ACTIVE'] }, 1, 0] },
                },
                completedSessions: {
                    $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] },
                },
                totalMinutes: {
                    $sum: {
                        $cond: [
                            { $and: [{ $eq: ['$status', 'COMPLETED'] }, { $gt: ['$durationMinutes', 0] }] },
                            '$durationMinutes',
                            0,
                        ],
                    },
                },
                longestSessionMinutes: {
                    $max: {
                        $cond: [
                            { $and: [{ $eq: ['$status', 'COMPLETED'] }, { $gt: ['$durationMinutes', 0] }] },
                            '$durationMinutes',
                            0,
                        ],
                    },
                },
                completedDurations: {
                    $push: {
                        $cond: [
                            { $and: [{ $eq: ['$status', 'COMPLETED'] }, { $gte: ['$durationMinutes', 0] }] },
                            '$durationMinutes',
                            '$$REMOVE',
                        ],
                    },
                },
            },
        },
        {
            $project: {
                _id: 0,
                totalSessions: 1,
                totalMembers: { $size: '$membersSet' },
                activeSessions: 1,
                completedSessions: 1,
                totalMinutes: 1,
                longestSessionMinutes: { $ifNull: ['$longestSessionMinutes', 0] },
                completedDurations: 1,
            },
        },
    ];
    const results = await AttendanceSession.aggregate(pipeline);
    if (results.length === 0) {
        return {
            totalSessions: 0,
            totalMembers: 0,
            activeSessions: 0,
            completedSessions: 0,
            totalMinutes: 0,
            averageSessionMinutes: 0,
            longestSessionMinutes: 0,
            shortestSessionMinutes: 0,
        };
    }
    const row = results[0];
    const durations = Array.isArray(row.completedDurations)
        ? row.completedDurations
        : [];
    const shortestSessionMinutes = durations.length > 0 ? Math.min(...durations) : 0;
    const averageSessionMinutes = row.completedSessions > 0
        ? Math.round(row.totalMinutes / row.completedSessions)
        : 0;
    return {
        totalSessions: row.totalSessions || 0,
        totalMembers: row.totalMembers || 0,
        activeSessions: row.activeSessions || 0,
        completedSessions: row.completedSessions || 0,
        totalMinutes: row.totalMinutes || 0,
        averageSessionMinutes,
        longestSessionMinutes: row.longestSessionMinutes || 0,
        shortestSessionMinutes,
    };
}
/**
 * 2. GET /api/attendance/analytics/daily
 * Returns daily aggregate attendance stats in IST.
 */
export async function getDailyAnalytics(startDateStr, endDateStr) {
    const match = buildDateMatch(startDateStr, endDateStr);
    const pipeline = [
        ...(Object.keys(match).length > 0 ? [{ $match: match }] : []),
        {
            $project: {
                date: {
                    $dateToString: {
                        format: '%Y-%m-%d',
                        date: '$checkIn',
                        timezone: '+05:30',
                    },
                },
                registrationNo: '$registrationNo',
                durationMinutes: {
                    $cond: [
                        { $and: [{ $eq: ['$status', 'COMPLETED'] }, { $gt: ['$durationMinutes', 0] }] },
                        '$durationMinutes',
                        0,
                    ],
                },
                isCompleted: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] },
            },
        },
        {
            $group: {
                _id: '$date',
                sessions: { $sum: 1 },
                completedSessions: { $sum: '$isCompleted' },
                membersSet: { $addToSet: '$registrationNo' },
                totalMinutes: { $sum: '$durationMinutes' },
            },
        },
        {
            $project: {
                _id: 0,
                date: '$_id',
                sessions: 1,
                members: { $size: '$membersSet' },
                totalMinutes: 1,
                averageMinutes: {
                    $cond: [
                        { $gt: ['$completedSessions', 0] },
                        { $round: [{ $divide: ['$totalMinutes', '$completedSessions'] }, 0] },
                        0,
                    ],
                },
            },
        },
        { $sort: { date: 1 } },
    ];
    return AttendanceSession.aggregate(pipeline);
}
/**
 * 3. GET /api/attendance/analytics/weekly
 * Returns attendance grouped by ISO week in IST (Monday start).
 */
export async function getWeeklyAnalytics(startDateStr, endDateStr) {
    const match = buildDateMatch(startDateStr, endDateStr);
    const pipeline = [
        ...(Object.keys(match).length > 0 ? [{ $match: match }] : []),
        {
            $project: {
                week: {
                    $dateToString: {
                        format: '%G-W%V',
                        date: '$checkIn',
                        timezone: '+05:30',
                    },
                },
                registrationNo: '$registrationNo',
                durationMinutes: {
                    $cond: [
                        { $and: [{ $eq: ['$status', 'COMPLETED'] }, { $gt: ['$durationMinutes', 0] }] },
                        '$durationMinutes',
                        0,
                    ],
                },
                isCompleted: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] },
            },
        },
        {
            $group: {
                _id: '$week',
                sessions: { $sum: 1 },
                completedSessions: { $sum: '$isCompleted' },
                membersSet: { $addToSet: '$registrationNo' },
                totalMinutes: { $sum: '$durationMinutes' },
            },
        },
        {
            $project: {
                _id: 0,
                week: '$_id',
                sessions: 1,
                members: { $size: '$membersSet' },
                totalMinutes: 1,
                averageMinutes: {
                    $cond: [
                        { $gt: ['$completedSessions', 0] },
                        { $round: [{ $divide: ['$totalMinutes', '$completedSessions'] }, 0] },
                        0,
                    ],
                },
            },
        },
        { $sort: { week: 1 } },
    ];
    return AttendanceSession.aggregate(pipeline);
}
/**
 * 4. GET /api/attendance/analytics/monthly
 * Returns attendance grouped by YYYY-MM in IST.
 */
export async function getMonthlyAnalytics(startDateStr, endDateStr) {
    const match = buildDateMatch(startDateStr, endDateStr);
    const pipeline = [
        ...(Object.keys(match).length > 0 ? [{ $match: match }] : []),
        {
            $project: {
                month: {
                    $dateToString: {
                        format: '%Y-%m',
                        date: '$checkIn',
                        timezone: '+05:30',
                    },
                },
                registrationNo: '$registrationNo',
                durationMinutes: {
                    $cond: [
                        { $and: [{ $eq: ['$status', 'COMPLETED'] }, { $gt: ['$durationMinutes', 0] }] },
                        '$durationMinutes',
                        0,
                    ],
                },
                isCompleted: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] },
            },
        },
        {
            $group: {
                _id: '$month',
                sessions: { $sum: 1 },
                completedSessions: { $sum: '$isCompleted' },
                membersSet: { $addToSet: '$registrationNo' },
                totalMinutes: { $sum: '$durationMinutes' },
            },
        },
        {
            $project: {
                _id: 0,
                month: '$_id',
                sessions: 1,
                members: { $size: '$membersSet' },
                totalMinutes: 1,
                averageMinutes: {
                    $cond: [
                        { $gt: ['$completedSessions', 0] },
                        { $round: [{ $divide: ['$totalMinutes', '$completedSessions'] }, 0] },
                        0,
                    ],
                },
            },
        },
        { $sort: { month: 1 } },
    ];
    return AttendanceSession.aggregate(pipeline);
}
/**
 * 5. GET /api/attendance/analytics/members
 * Returns member-wise performance, completed sessions, and distinct attendance days.
 */
export async function getMemberAnalytics(startDateStr, endDateStr) {
    const match = buildDateMatch(startDateStr, endDateStr);
    const pipeline = [
        ...(Object.keys(match).length > 0 ? [{ $match: match }] : []),
        {
            $project: {
                userId: '$userId',
                name: '$name',
                registrationNo: '$registrationNo',
                dateStr: {
                    $dateToString: {
                        format: '%Y-%m-%d',
                        date: '$checkIn',
                        timezone: '+05:30',
                    },
                },
                status: '$status',
                durationMinutes: {
                    $cond: [
                        { $and: [{ $eq: ['$status', 'COMPLETED'] }, { $gt: ['$durationMinutes', 0] }] },
                        '$durationMinutes',
                        0,
                    ],
                },
                isCompleted: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] },
            },
        },
        {
            $group: {
                _id: '$userId',
                name: { $first: '$name' },
                registrationNo: { $first: '$registrationNo' },
                sessions: { $sum: 1 },
                completedSessions: { $sum: '$isCompleted' },
                totalMinutes: { $sum: '$durationMinutes' },
                daysSet: { $addToSet: '$dateStr' },
            },
        },
        {
            $project: {
                _id: 0,
                userId: { $toString: '$_id' },
                name: 1,
                registrationNo: 1,
                sessions: 1,
                completedSessions: 1,
                attendanceDays: { $size: '$daysSet' },
                totalMinutes: 1,
                averageMinutes: {
                    $cond: [
                        { $gt: ['$completedSessions', 0] },
                        { $round: [{ $divide: ['$totalMinutes', '$completedSessions'] }, 0] },
                        0,
                    ],
                },
            },
        },
        { $sort: { totalMinutes: -1 } },
    ];
    return AttendanceSession.aggregate(pipeline);
}
/**
 * 6. GET /api/attendance/analytics/distribution
 * Group completed sessions by duration:
 * < 30 min, 30–60 min, 1–2 hours, 2–3 hours, 3–4 hours, 4+ hours
 */
export async function getDurationDistribution(startDateStr, endDateStr) {
    const match = buildDateMatch(startDateStr, endDateStr);
    match.status = 'COMPLETED';
    const pipeline = [
        { $match: match },
        {
            $project: {
                duration: { $ifNull: ['$durationMinutes', 0] },
            },
        },
        {
            $bucket: {
                groupBy: '$duration',
                boundaries: [0, 30, 60, 120, 180, 240],
                default: '4+ hours',
                output: {
                    count: { $sum: 1 },
                },
            },
        },
    ];
    const results = await AttendanceSession.aggregate(pipeline);
    const bucketMap = {
        '0': '< 30 min',
        '30': '30–60 min',
        '60': '1–2 hours',
        '120': '2–3 hours',
        '180': '3–4 hours',
        '4+ hours': '4+ hours',
    };
    // Base buckets template to guarantee all 6 ranges exist
    const standardRanges = [
        '< 30 min',
        '30–60 min',
        '1–2 hours',
        '2–3 hours',
        '3–4 hours',
        '4+ hours',
    ];
    const countMap = {};
    standardRanges.forEach((r) => (countMap[r] = 0));
    results.forEach((row) => {
        const key = String(row._id);
        const rangeName = bucketMap[key] || '4+ hours';
        countMap[rangeName] = (countMap[rangeName] || 0) + row.count;
    });
    return standardRanges.map((range) => ({
        range,
        sessions: countMap[range] || 0,
    }));
}
/**
 * 7. GET /api/attendance/analytics/heatmap
 * Returns daily aggregate minutes and session counts for a calendar heatmap.
 */
export async function getAttendanceHeatmap(startDateStr, endDateStr) {
    const match = buildDateMatch(startDateStr, endDateStr);
    const pipeline = [
        ...(Object.keys(match).length > 0 ? [{ $match: match }] : []),
        {
            $project: {
                date: {
                    $dateToString: {
                        format: '%Y-%m-%d',
                        date: '$checkIn',
                        timezone: '+05:30',
                    },
                },
                durationMinutes: {
                    $cond: [
                        { $and: [{ $eq: ['$status', 'COMPLETED'] }, { $gt: ['$durationMinutes', 0] }] },
                        '$durationMinutes',
                        0,
                    ],
                },
            },
        },
        {
            $group: {
                _id: '$date',
                minutes: { $sum: '$durationMinutes' },
                sessions: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: 0,
                date: '$_id',
                minutes: 1,
                sessions: 1,
            },
        },
        { $sort: { date: 1 } },
    ];
    return AttendanceSession.aggregate(pipeline);
}
/**
 * 8. GET /api/attendance/analytics/comparison
 * Compares current period with preceding period of identical duration.
 */
export async function getPeriodComparison(startDateStr, endDateStr) {
    const { startDate, endDate } = parseDateRange(startDateStr, endDateStr);
    // If no date range provided, default to current 7-day window
    const now = new Date();
    const currentEnd = endDate || now;
    const currentStart = startDate || new Date(currentEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    const durationMs = Math.max(24 * 60 * 60 * 1000, currentEnd.getTime() - currentStart.getTime());
    const prevStart = new Date(currentStart.getTime() - durationMs);
    const prevEnd = new Date(currentStart.getTime());
    // Aggregate metrics helper for a given Date window
    const computeMetrics = async (start, end) => {
        const pipeline = [
            {
                $match: {
                    checkIn: { $gte: start, $lt: end },
                },
            },
            {
                $project: {
                    dateStr: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$checkIn',
                            timezone: '+05:30',
                        },
                    },
                    durationMinutes: {
                        $cond: [
                            { $and: [{ $eq: ['$status', 'COMPLETED'] }, { $gt: ['$durationMinutes', 0] }] },
                            '$durationMinutes',
                            0,
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    sessions: { $sum: 1 },
                    totalMinutes: { $sum: '$durationMinutes' },
                    daysSet: { $addToSet: '$dateStr' },
                },
            },
            {
                $project: {
                    _id: 0,
                    sessions: 1,
                    totalMinutes: 1,
                    attendanceDays: { $size: '$daysSet' },
                },
            },
        ];
        const res = await AttendanceSession.aggregate(pipeline);
        if (res.length === 0) {
            return { totalHours: 0, totalMinutes: 0, sessions: 0, attendanceDays: 0 };
        }
        const minutes = res[0].totalMinutes || 0;
        return {
            totalHours: Math.round((minutes / 60) * 10) / 10,
            totalMinutes: minutes,
            sessions: res[0].sessions || 0,
            attendanceDays: res[0].attendanceDays || 0,
        };
    };
    const [current, previous] = await Promise.all([
        computeMetrics(currentStart, currentEnd),
        computeMetrics(prevStart, prevEnd),
    ]);
    const calcPercentageChange = (curr, prev) => {
        if (prev === 0) {
            return curr === 0 ? 0 : null; // null indicates 'N/A' or 'New', avoids Infinity
        }
        const change = ((curr - prev) / prev) * 100;
        return Math.round(change * 10) / 10;
    };
    return {
        current,
        previous,
        changePercentage: {
            totalMinutes: calcPercentageChange(current.totalMinutes, previous.totalMinutes),
            sessions: calcPercentageChange(current.sessions, previous.sessions),
            attendanceDays: calcPercentageChange(current.attendanceDays, previous.attendanceDays),
        },
    };
}
