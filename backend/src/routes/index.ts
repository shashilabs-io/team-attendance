import { Router } from 'express';
import healthRoutes from './health.routes.js';
import userRoutes from './userRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
import googleFormRoutes from './googleFormRoutes.js';
import authRoutes from './authRoutes.js';

const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/attendance', attendanceRoutes);
apiRouter.use('/integrations/google-form', googleFormRoutes);

export default apiRouter;
