import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let isOperational = false;

  // Check if it's an instance of our custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  }

  // Log error using Winston logger
  logger.error(`${statusCode} - ${message} - ${req.method} ${req.originalUrl} - IP: ${req.ip} \nStack: ${err.stack}`);

  // In production, mask non-operational system error stack traces
  const responsePayload = {
    status: 'error',
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' || !isOperational ? { stack: err.stack } : {}),
  };

  res.status(statusCode).json(responsePayload);
};
