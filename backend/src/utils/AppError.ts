export type AppErrorCode =
  | 'USER_NOT_FOUND'
  | 'USER_INACTIVE'
  | 'ALREADY_CHECKED_IN'
  | 'NO_CHECK_IN'
  | 'SESSION_NOT_FOUND'
  | 'ROUTE_NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'INVALID_DURATION'
  | 'DATABASE_ERROR';

export class AppError extends Error {
  public readonly code: AppErrorCode;

  constructor(code: AppErrorCode, message: string) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
