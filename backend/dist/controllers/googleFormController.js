import { env } from '../config/env.js';
import { googleFormAttendanceSchema } from '../validators/googleFormValidator.js';
import { getActiveTeamMemberByRegistrationNo } from '../services/userService.js';
import * as attendanceService from '../services/attendanceService.js';
import { AppError } from '../utils/AppError.js';
// In-memory debounce cache to guard against instantaneous double-submissions (e.g. form double-click)
const recentSubmissionsCache = new Map();
const DEDUPLICATION_WINDOW_MS = 3000; // 3 seconds window
function isRecentDuplicate(key) {
    const now = Date.now();
    const lastTime = recentSubmissionsCache.get(key);
    if (lastTime && now - lastTime < DEDUPLICATION_WINDOW_MS) {
        return true;
    }
    recentSubmissionsCache.set(key, now);
    // Evict entries older than 30 seconds
    if (recentSubmissionsCache.size > 200) {
        for (const [k, time] of recentSubmissionsCache.entries()) {
            if (now - time > 30000) {
                recentSubmissionsCache.delete(k);
            }
        }
    }
    return false;
}
/**
 * POST /api/integrations/google-form/attendance
 * Webhook endpoint for Google Form attendance submissions.
 */
export async function handleGoogleFormAttendance(req, res, next) {
    try {
        // 1. Webhook authentication via secret header
        const providedSecret = req.headers['x-google-form-secret'] ||
            req.headers['x-webhook-secret'];
        if (!providedSecret || providedSecret !== env.GOOGLE_FORM_WEBHOOK_SECRET) {
            throw new AppError('UNAUTHORIZED', 'Invalid or missing webhook secret.');
        }
        // 2. Validate payload structure using Zod
        const parseResult = googleFormAttendanceSchema.safeParse(req.body);
        if (!parseResult.success) {
            const errorMsg = parseResult.error.issues.map((i) => i.message).join('; ');
            throw new AppError('VALIDATION_ERROR', errorMsg);
        }
        const { registrationNo, name, action, task, remarks, submissionId } = parseResult.data;
        // 3. Debounce rapid duplicate submission retry if submissionId is supplied
        if (submissionId && isRecentDuplicate(submissionId)) {
            throw new AppError('DUPLICATE_SUBMISSION', 'Duplicate form submission detected. This submission is already being processed.');
        }
        // 4. Authoritative Member lookup by registration number
        const user = await getActiveTeamMemberByRegistrationNo(registrationNo);
        // 5. Name verification against database name (case-insensitive & trimmed)
        const normalizedDbName = user.name.trim().toLowerCase();
        const normalizedSubmittedName = name.trim().toLowerCase();
        if (normalizedDbName !== normalizedSubmittedName) {
            throw new AppError('NAME_MISMATCH', `Submitted name "${name}" does not match the registered team member name.`);
        }
        // 6. Execute Check-In or Check-Out via existing attendance business logic
        if (action === 'CHECK_IN') {
            await attendanceService.checkInUser({
                registrationNo: user.registrationNo,
                task,
                remarks,
                source: 'GOOGLE_FORM',
                submissionId,
            });
            res.status(200).json({
                success: true,
                data: {
                    action: 'CHECK_IN',
                    message: 'Attendance checked in successfully',
                },
            });
            return;
        }
        if (action === 'CHECK_OUT') {
            await attendanceService.checkOutUser({
                registrationNo: user.registrationNo,
                task,
                source: 'GOOGLE_FORM',
                submissionId,
            });
            res.status(200).json({
                success: true,
                data: {
                    action: 'CHECK_OUT',
                    message: 'Attendance checked out successfully',
                },
            });
            return;
        }
        throw new AppError('VALIDATION_ERROR', 'Invalid action specified');
    }
    catch (error) {
        next(error);
    }
}
