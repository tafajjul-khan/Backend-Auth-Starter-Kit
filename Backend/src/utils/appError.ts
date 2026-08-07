export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: any;
  constructor(statusCode: number, message: string, errors?: any) {
    super(message);
    this.statusCode = statusCode;

    // Identifies known operational errors vs. unexpected bugs (e.g., database crashes)
    this.isOperational = true;

    if (errors) {
      this.errors = errors;
    }

    // Corrects the prototype chain for TypeScript inheritance
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
