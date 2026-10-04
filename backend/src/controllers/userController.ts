import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService.js';

/**
 * GET /api/users
 * Returns all registered team members.
 */
export async function getUsersHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/users/:id
 * Returns a single team member by MongoDB ID.
 */
export async function getUserByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params.id);
    const user = await userService.getUserById(id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/users/:id/status
 * Returns current active attendance status of a user.
 */
export async function getUserStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params.id);
    const statusData = await userService.getUserStatus(id);
    res.status(200).json({
      success: true,
      data: statusData,
    });
  } catch (error) {
    next(error);
  }
}
