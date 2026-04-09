export class AppError extends Error {
  constructor(message, statusCode = 500, metadata = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;
    this.metadata = metadata;
  }
}
