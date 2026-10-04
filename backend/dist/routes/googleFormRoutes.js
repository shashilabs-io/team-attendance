import { Router } from 'express';
import { handleGoogleFormAttendance } from '../controllers/googleFormController.js';
const router = Router();
// POST /api/integrations/google-form/attendance
router.post('/attendance', handleGoogleFormAttendance);
export default router;
