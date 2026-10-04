import { Router } from 'express';
import {
  getUsersHandler,
  getUserByIdHandler,
  getUserStatusHandler,
} from '../controllers/userController.js';

const router = Router();

// GET /api/users
router.get('/', getUsersHandler);

// GET /api/users/:id
router.get('/:id', getUserByIdHandler);

// GET /api/users/:id/status
router.get('/:id/status', getUserStatusHandler);

export default router;
