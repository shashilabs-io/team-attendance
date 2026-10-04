import { Router } from 'express';
import {
  getAttendanceHandler,
  getSessionByIdHandler,
  getActiveMembersHandler,
  getTodayAttendanceHandler,
  getSummaryHandler,
  getDailyStatsHandler,
  getMemberStatsHandler,
  getEventsHandler,
} from '../controllers/attendanceController.js';
import * as analyticsController from '../controllers/analyticsController.js';
import { validateQuery } from '../middleware/validate.js';
import {
  attendanceFilterSchema,
  statsFilterSchema,
  eventFilterSchema,
} from '../validators/attendanceValidators.js';

const router = Router();

// GET /api/attendance/active
router.get('/active', getActiveMembersHandler);

// GET /api/attendance/today
router.get('/today', getTodayAttendanceHandler);

// GET /api/attendance/summary
router.get('/summary', getSummaryHandler);

// GET /api/attendance/stats/daily
router.get('/stats/daily', validateQuery(statsFilterSchema), getDailyStatsHandler);

// GET /api/attendance/stats/members
router.get('/stats/members', validateQuery(statsFilterSchema), getMemberStatsHandler);

// GET /api/attendance/events
router.get('/events', validateQuery(eventFilterSchema), getEventsHandler);

// ==========================================
// PHASE 7 ADVANCED ANALYTICS ROUTES
// ==========================================

// GET /api/attendance/analytics
router.get(
  '/analytics',
  validateQuery(statsFilterSchema),
  analyticsController.getOverallAnalyticsHandler
);

// GET /api/attendance/analytics/daily
router.get(
  '/analytics/daily',
  validateQuery(statsFilterSchema),
  analyticsController.getDailyAnalyticsHandler
);

// GET /api/attendance/analytics/weekly
router.get(
  '/analytics/weekly',
  validateQuery(statsFilterSchema),
  analyticsController.getWeeklyAnalyticsHandler
);

// GET /api/attendance/analytics/monthly
router.get(
  '/analytics/monthly',
  validateQuery(statsFilterSchema),
  analyticsController.getMonthlyAnalyticsHandler
);

// GET /api/attendance/analytics/members
router.get(
  '/analytics/members',
  validateQuery(statsFilterSchema),
  analyticsController.getMemberAnalyticsHandler
);

// GET /api/attendance/analytics/distribution
router.get(
  '/analytics/distribution',
  validateQuery(statsFilterSchema),
  analyticsController.getDistributionHandler
);

// GET /api/attendance/analytics/heatmap
router.get(
  '/analytics/heatmap',
  validateQuery(statsFilterSchema),
  analyticsController.getHeatmapHandler
);

// GET /api/attendance/analytics/comparison
router.get(
  '/analytics/comparison',
  validateQuery(statsFilterSchema),
  analyticsController.getComparisonHandler
);

// GET /api/attendance (paginated with filters)
router.get('/', validateQuery(attendanceFilterSchema), getAttendanceHandler);

// GET /api/attendance/:id (single session)
router.get('/:id', getSessionByIdHandler);

export default router;
