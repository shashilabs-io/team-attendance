import { Request, Response, NextFunction } from 'express';
import { verifyToken, AuthTokenPayload } from '../utils/token.js';
import { AppError } from '../utils/AppError.js';

export interface AuthenticatedRequest extends Request {
  user: AuthTokenPayload;
}

/**
 * Middleware that strictly enforces valid JWT authentication.
 */
export function authenticateUser(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('UNAUTHORIZED', 'Authentication required. Please log in.');
  }

  const token = authHeader.substring(7).trim();
  const payload = verifyToken(token);

  if (!payload) {
    throw new AppError('UNAUTHORIZED', 'Invalid or expired session. Please log in again.');
  }

  (req as any).user = payload;
  next();
}

/**
 * Middleware that verifies the authenticated user has the 'ADMIN' role.
 */
export function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const user = (req as any).user as AuthTokenPayload | undefined;

  if (!user) {
    throw new AppError('UNAUTHORIZED', 'Authentication required.');
  }

  if (user.role !== 'ADMIN') {
    throw new AppError('FORBIDDEN', 'Access denied. Administrator privileges required.');
  }

  next();
}

/**
 * Optional authentication middleware that attaches user if a valid token is provided.
 */
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const payload = verifyToken(token);
    if (payload) {
      (req as any).user = payload;
    }
  }
  next();
}
