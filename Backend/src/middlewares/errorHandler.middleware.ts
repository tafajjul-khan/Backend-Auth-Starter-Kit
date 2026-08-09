import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/appError.ts";
import Logger from "../utils/logger.ts";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong on the server";
  let errorDetails = null;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    if (err.errors) {
      errorDetails = err.errors;
    }
    Logger.warn(
      `[${req.method}] ${req.originalUrl} - Status: ${statusCode} - Message: ${message}`,
    );
  } else {
    Logger.error(
      `[${req.method}] ${req.originalUrl} - Status: ${statusCode} - Message: ${message}\n💥 Stack: ${err.stack || err}`,
    );
  }

  res.status(statusCode).json({
    success: false,
    status: statusCode >= 400 && statusCode < 500 ? "fail" : "error",
    message: message,
    ...(errorDetails && { errors: errorDetails }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
