import { param, query, validationResult, ValidationError } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../utils/errors';

/**
 * Validates document ID parameter
 */
export const validateDocumentId = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Document ID is required')
    .isString()
    .withMessage('Document ID must be a string'),
];

/**
 * Validates total pages query parameter
 */
export const validateTotalPages = [
  query('totalPages')
    .trim()
    .optional()
    .isInt({ min: 1 })
    .withMessage('Total pages must be a positive integer'),
];

/**
 * Validates file upload
 */
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    throw new CustomError('No file uploaded', 400);
  }

  if (req.file.mimetype !== 'application/pdf') {
    throw new CustomError('Only PDF files are allowed', 400);
  }

  next();
};

/**
 * Handles validation errors from express-validator
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error: ValidationError) => error.msg);
    throw new CustomError(errorMessages.join(', '), 400);
  }
  next();
}; 