import * as attendanceService from '../services/attendanceService.js';
/**
 * GET /api/attendance
 * Returns paginated attendance sessions with optional filters.
 */
export async function getAttendanceHandler(req, res, next) {
    try {
        const { page, limit, userId, registrationNo, status, startDate, endDate } = req.query;
        const result = await attendanceService.getAttendanceSessions({
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            userId,
            registrationNo,
            status,
            startDate,
            endDate,
        });
        res.status(200).json({
            success: true,
            data: result.data,
            pagination: result.pagination,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/attendance/:id
 * Returns a single attendance session by ID.
 */
export async function getSessionByIdHandler(req, res, next) {
    try {
        const id = String(req.params.id);
        const session = await attendanceService.getSessionById(id);
        res.status(200).json({
            success: true,
            data: session,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/attendance/active
 * Returns all currently checked-in team members with live working duration.
 */
export async function getActiveMembersHandler(_req, res, next) {
    try {
        const activeMembers = await attendanceService.getActiveMembers();
        res.status(200).json({
            success: true,
            data: activeMembers,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/attendance/today
 * Returns all attendance records for the current day in IST.
 */
export async function getTodayAttendanceHandler(_req, res, next) {
    try {
        const todaySessions = await attendanceService.getTodayAttendance();
        res.status(200).json({
            success: true,
            data: todaySessions,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/attendance/summary
 * Returns high-level metrics for dashboard cards.
 */
export async function getSummaryHandler(_req, res, next) {
    try {
        const summary = await attendanceService.getAttendanceSummary();
        res.status(200).json({
            success: true,
            data: summary,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/attendance/stats/daily
 * Returns daily aggregate attendance stats.
 */
export async function getDailyStatsHandler(req, res, next) {
    try {
        const { startDate, endDate } = req.query;
        const stats = await attendanceService.getDailyStats(startDate, endDate);
        res.status(200).json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/attendance/stats/members
 * Returns aggregate stats per team member.
 */
export async function getMemberStatsHandler(req, res, next) {
    try {
        const { startDate, endDate } = req.query;
        const stats = await attendanceService.getMemberStats(startDate, endDate);
        res.status(200).json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/attendance/events
 * Returns paginated immutable audit event records.
 */
export async function getEventsHandler(req, res, next) {
    try {
        const { page, limit, userId, type, startDate, endDate } = req.query;
        const result = await attendanceService.getAttendanceEvents({
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            userId,
            type,
            startDate,
            endDate,
        });
        res.status(200).json({
            success: true,
            data: result.data,
            pagination: result.pagination,
        });
    }
    catch (error) {
        next(error);
    }
}
