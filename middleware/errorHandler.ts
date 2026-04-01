import { Request, Response, NextFunction } from 'express';
const isProduction = process.env.NODE_ENV === 'production';
export class ApiError extends Error {
  public statusCode: number;
  constructor(statusCode: number, message: string, name: string = 'ApiError') {
    super(message);
    this.statusCode = statusCode;
    if (name) this.name = name;
    Error.captureStackTrace(this, this.constructor);
  }
}
export class BadRequestError extends ApiError {
  constructor(message: string) {
    super(400, message, 'BadRequestError');
  }
}
export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(404, message, 'NotFoundError');
  }
}
export class InternalServerError extends ApiError {
  constructor(message: string) {
    super(500, message, 'InternalServerError');
  }
}

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let message = 'An unexpected error occurred.';

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  if (err instanceof InternalServerError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  if (err instanceof BadRequestError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  if (err instanceof NotFoundError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  res.status(statusCode).json({
    status: 'error',
    success: false,
    message:
      isProduction && statusCode === 500 ? 'Something went wrong' : message,
  });
};
