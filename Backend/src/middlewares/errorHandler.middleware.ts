import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.ts';

export const globalErrorHandler = (
  err: any, // यहाँ 'any' या 'Error | AppError' रखें
  req: Request,
  res: Response,
  next: NextFunction 
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong on the server';
  let errorDetails = null; // Zod की गलतियों को रखने के लिए वेरिएबल

  // 1. चेक करें कि क्या यह हमारा कस्टम AppError है
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    // 🔴 यहाँ जादू है: AppError के अंदर छिपे Zod errorMessages को निकालें
    if (err.errors) {
      errorDetails = err.errors;
    }
  }

  console.error('💥 ERROR:', err);

  // 2. फ्रंटएंड को रिस्पांस भेजें
  res.status(statusCode).json({
    success: false,
    status: statusCode >= 400 && statusCode < 500 ? 'fail' : 'error',
    message: message,
    // 🔴 अगर Zod की डिटेल्स (errorDetails) मौजूद हैं, तो उन्हें 'errors' की में भेजें
    ...(errorDetails && { errors: errorDetails }), 
    // सिर्फ डेवलपमेंट मोड में स्टैक ट्रेस दिखाएँ
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
