import { Router } from 'express';
import mongoose from 'mongoose';
const router = Router();
router.get('/', (_req, res) => {
    const isConnected = mongoose.connection.readyState === 1;
    if (isConnected) {
        return res.status(200).json({
            success: true,
            message: 'Team Attendance API is healthy',
            database: 'connected',
        });
    }
    return res.status(503).json({
        success: false,
        message: 'Team Attendance API is degraded (database disconnected)',
        database: 'disconnected',
    });
});
export default router;
