import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { CustomError } from '../utils/errors';
import { MAX_FILE_SIZE } from './upload';

/**
 * Handles custom application errors
 */
export const handleCustomError = (
  err: CustomError,
  res: Response
) => {
  return res.status(err.statusCode).json({
    error: err.message
  });
};

/**
 * Handles Multer file upload errors
 */
export const handleMulterError = (
  err: MulterError,
  res: Response
) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: `File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    });
  }
  return res.status(400).json({
    error: 'File upload error'
  });
};

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });

  // Handle custom application errors
  if (err instanceof CustomError) {
    return handleCustomError(err, res);
  }

  // Handle Multer file upload errors
  if (err instanceof MulterError) {
    return handleMulterError(err, res);
  }

  // Handle all other errors
  return res.status(500).json({
    error: 'Internal server error'
  });
}; 