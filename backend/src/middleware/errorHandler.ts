import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { CustomError } from '../utils/errors';
import { MAX_FILE_SIZE } from './upload';
import mongoose from 'mongoose';

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
  err: MulterError | Error,
  res: Response
) => {
  if ((err as any).code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: `File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    });
  }
  if ((err as any).code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'File upload error'
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
  if (err instanceof MulterError || (err as any).code === 'LIMIT_FILE_SIZE' || (err as any).code === 'LIMIT_UNEXPECTED_FILE') {
    return handleMulterError(err, res);
  }

  // Handle Mongoose validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    const details: Record<string, string> = {};
    Object.keys(err.errors).forEach(key => {
      details[key] = err.errors[key].message;
    });

    return res.status(500).json({
      error: 'Validation Error',
      details
    });
  }

  // Handle Mongoose CastError
  if (err instanceof mongoose.Error.CastError) {
    return res.status(500).json({
      error: `Invalid ${err.path}: ${err.value}`
    });
  }

  // Handle Mongoose duplicate key error
  if ((err as any).code === 11000) {
    // Extract field name from error message if keyValue is not available
    let field = 'field';
    if ((err as any).keyValue) {
      field = Object.keys((err as any).keyValue)[0];
    } else if (err.message.includes('duplicate key error')) {
      // Try to extract field from error message
      const matches = err.message.match(/index:\s+(\w+)_/);
      if (matches && matches[1]) {
        field = matches[1];
      }
    }

    return res.status(500).json({
      error: `Duplicate field value: ${field}`
    });
  }

  // Handle file upload errors
  if ((err as any).field) {
    return res.status(500).json({
      error: 'File upload error'
    });
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.message.includes('JSON')) {
    return res.status(500).json({
      error: 'Invalid JSON'
    });
  }

  // Handle all other errors
  return res.status(500).json({
    error: 'Internal server error'
  });
}; 