import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Middleware generator for validating request query parameters using Zod schemas.
 */
export function validateQuery(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req.query);
      req.query = parsed as any;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const firstIssue = error.issues[0];
        const field = firstIssue?.path.join('.') || 'query';
        const message = firstIssue?.message || 'Invalid query parameters';

        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `${field}: ${message}`,
          },
        });
        return;
      }
      next(error);
    }
  };
}
