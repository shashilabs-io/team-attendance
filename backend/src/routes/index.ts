import { Router } from 'express';
import healthRoutes from './health.routes.js';
import userRoutes from './userRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';

const apiRouter = Router();

apiRouter.use('/health', healthRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/attendance', attendanceRoutes);

export default apiRouter;
