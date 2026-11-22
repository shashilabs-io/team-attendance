import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  const isConnected = mongoose.connection.readyState === 1;

  if (isConnected) {
    try {
      // Actively ping MongoDB Atlas to keep the TCP connection pool warm and active
      await mongoose.connection.db?.admin().ping();

      return res.status(200).json({
        success: true,
        message: 'Team Attendance API is healthy',
        database: 'connected',
      });
    } catch (pingError) {
      console.warn('MongoDB ping failed during health check:', pingError);
    }
  }

  return res.status(503).json({
    success: false,
    message: 'Team Attendance API is degraded (database disconnected)',
    database: 'disconnected',
  });
});

export default router;
