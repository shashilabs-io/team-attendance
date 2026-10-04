import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

/**
 * 404 Not Found Handler for unknown routes.
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'Route not found',
    },
  });
}

/**
 * Centralized global Express error handler.
 * Handles AppError, Mongoose CastError, Mongoose ValidationError, and unknown exceptions.
 */
export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (env.NODE_ENV === 'development') {
    console.error('API Error:', err);
  }

  // 1. Handled business AppError
  if (err instanceof AppError) {
    let statusCode = 400;
    if (
      err.code === 'USER_NOT_FOUND' ||
      err.code === 'SESSION_NOT_FOUND' ||
      err.code === 'ROUTE_NOT_FOUND'
    ) {
      statusCode = 404;
    }

    res.status(statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // 2. Mongoose CastError (e.g. malformed ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: `Invalid identifier format for field '${err.path}'`,
      },
    });
    return;
  }

  // 3. Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const errorMessages = Object.values(err.errors || {}).map((e: any) => e.message);
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: errorMessages.join('; ') || 'Database validation failed',
      },
    });
    return;
  }

  // 4. Default / Unhandled internal error
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    },
  });
}
