import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../../middleware/errorHandler';
import { CustomError } from '../../utils/errors';
import mongoose from 'mongoose';
import multer from 'multer';

describe('Error Handler Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.Mock;
    let originalConsoleError: any;

    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();

        // Mock console.error to avoid cluttering test output
        originalConsoleError = console.error;
        console.error = jest.fn();
    });

    afterEach(() => {
        // Restore console.error
        console.error = originalConsoleError;
    });

    test('should handle CustomError', () => {
        const customError = new CustomError('Test error', 400);

        errorHandler(customError, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
            error: 'Test error'
        });
    });

    test('should handle Mongoose validation errors', () => {
        const validationError = new mongoose.Error.ValidationError();
        validationError.errors = {
            name: new mongoose.Error.ValidatorError({
                message: 'Name is required',
                path: 'name',
                type: 'required'
            } as any),
            email: new mongoose.Error.ValidatorError({
                message: 'Email is invalid',
                path: 'email',
                type: 'format'
            } as any)
        };

        errorHandler(validationError, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
            error: 'Validation Error',
            details: {
                name: 'Name is required',
                email: 'Email is invalid'
            }
        });
    });

    test('should handle Mongoose CastError', () => {
        const castError = new mongoose.Error.CastError('ObjectId', 'invalid-id', 'id');

        errorHandler(castError, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
            error: 'Invalid id: invalid-id'
        });
    });

    test('should handle Mongoose duplicate key error', () => {
        const duplicateError = new Error('E11000 duplicate key error collection: test.users index: email_1 dup key: { email: "test@example.com" }');
        (duplicateError as any).code = 11000;

        errorHandler(duplicateError, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
            error: 'Duplicate field value: email'
        });
    });

    test('should handle multer file size limit error', () => {
        const error = new Error('File too large');
        (error as any).code = 'LIMIT_FILE_SIZE';

        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
            error: 'File size too large. Maximum size is 100MB'
        });
    });

    test('should handle multer file type error', () => {
        const error = new Error('Wrong file type');
        (error as any).code = 'LIMIT_UNEXPECTED_FILE';

        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
            error: 'File upload error'
        });
    });

    test('should handle other file upload errors', () => {
        const error = new Error('File upload error');
        (error as any).field = 'document';

        errorHandler(error as any, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
            error: 'File upload error'
        });
    });

    test('should handle SyntaxError (JSON parsing)', () => {
        const syntaxError = new SyntaxError('Unexpected token in JSON');

        errorHandler(syntaxError, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
            error: 'Invalid JSON'
        });
    });

    test('should handle generic errors in production', () => {
        // Mock production environment
        const originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        const error = new Error('Server error');

        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
            error: 'Internal server error'
        });

        // Restore environment
        process.env.NODE_ENV = originalNodeEnv;
    });

    test('should handle generic errors in development', () => {
        // Mock development environment
        const originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        const error = new Error('Server error');

        errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
            error: 'Internal server error'
        });

        // Restore environment
        process.env.NODE_ENV = originalNodeEnv;
    });
}); 