import { AppError } from '../common/appError.js';
import { logger } from '../common/logger.js';

export const notFoundHandler = (req, res, next) => {
  next(new AppError(`Nie znaleziono endpointu: ${req.method} ${req.originalUrl}`, 404));
};

export const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode ?? 500;
  const isOperational = Boolean(error.isOperational);

  logger.error(
    {
      err: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
      path: req.originalUrl,
      method: req.method,
      statusCode,
      isOperational,
    },
    'Request processing failed',
  );

  if (statusCode >= 500 && !isOperational) {
    return res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
  }

  return res.status(statusCode).json({ error: error.message || 'Wystąpił błąd' });
};
