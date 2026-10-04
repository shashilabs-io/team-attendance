import * as analyticsService from '../services/analyticsService.js';
/**
 * GET /api/attendance/analytics
 */
export async function getOverallAnalyticsHandler(req, res, next) {
    try {
        const { startDate, endDate } = req.query;
        const data = await analyticsService.getOverallAnalytics(startDate, endDate);
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/attendance/analytics/daily
 */
export async function getDailyAnalyticsHandler(req, res, next) {
    try {
        const { startDate, endDate } = req.query;
        const data = await analyticsService.getDailyAnalytics(startDate, endDate);
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/attendance/analytics/weekly
 */
export async function getWeeklyAnalyticsHandler(req, res, next) {
    try {
        const { startDate, endDate } = req.query;
        const data = await analyticsService.getWeeklyAnalytics(startDate, endDate);
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/attendance/analytics/monthly
 */
export async function getMonthlyAnalyticsHandler(req, res, next) {
    try {
        const { startDate, endDate } = req.query;
        const data = await analyticsService.getMonthlyAnalytics(startDate, endDate);
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/attendance/analytics/members
 */
export async function getMemberAnalyticsHandler(req, res, next) {
    try {
        const { startDate, endDate } = req.query;
        const data = await analyticsService.getMemberAnalytics(startDate, endDate);
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/attendance/analytics/distribution
 */
export async function getDistributionHandler(req, res, next) {
    try {
        const { startDate, endDate } = req.query;
        const data = await analyticsService.getDurationDistribution(startDate, endDate);
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/attendance/analytics/heatmap
 */
export async function getHeatmapHandler(req, res, next) {
    try {
        const { startDate, endDate } = req.query;
        const data = await analyticsService.getAttendanceHeatmap(startDate, endDate);
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
}
/**
 * GET /api/attendance/analytics/comparison
 */
export async function getComparisonHandler(req, res, next) {
    try {
        const { startDate, endDate } = req.query;
        const data = await analyticsService.getPeriodComparison(startDate, endDate);
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        next(error);
    }
}
