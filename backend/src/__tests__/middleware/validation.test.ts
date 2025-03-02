import { Request, Response, NextFunction } from 'express';
import { validateDocumentId, validateTotalPages, validateFileUpload, handleValidationErrors } from '../../middleware/validation';
import { CustomError } from '../../utils/errors';
import * as expressValidator from 'express-validator';

// Move the mocking before the function creation to avoid reference error
jest.mock('express-validator', () => {
    // Create a chainable mock object with index signature for string keys
    const chainable: { [key: string]: jest.Mock } = {};
    const methods = ['param', 'query', 'trim', 'notEmpty', 'optional', 'isInt', 'isString', 'withMessage'];

    methods.forEach(method => {
        chainable[method] = jest.fn().mockReturnValue(chainable);
    });

    return {
        param: jest.fn().mockReturnValue(chainable),
        query: jest.fn().mockReturnValue(chainable),
        validationResult: jest.fn()
    };
});

describe('Validation Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.Mock;

    // Cast the mocked function to the correct type
    const mockValidationResult = expressValidator.validationResult as jest.MockedFunction<typeof expressValidator.validationResult>;

    beforeEach(() => {
        mockRequest = {
            params: {},
            query: {},
            file: {
                mimetype: 'application/pdf',
                originalname: 'test.pdf'
            } as Express.Multer.File
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();

        // Reset all mocks
        jest.clearAllMocks();
    });

    describe('validateFileUpload', () => {
        test('should pass validation for PDF files', () => {
            // Call middleware
            validateFileUpload(mockRequest as Request, mockResponse as Response, mockNext);

            // Verify next was called without errors
            expect(mockNext).toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
        });

        test('should reject when no file is uploaded', () => {
            // Remove file from request
            mockRequest.file = undefined;

            // Call middleware and catch the error
            try {
                validateFileUpload(mockRequest as Request, mockResponse as Response, mockNext);
                // If we reach here, the test should fail
                expect('Middleware did not throw an error').toBe('It should have thrown an error');
            } catch (err) {
                // Verify correct error was thrown
                expect(err).toBeInstanceOf(CustomError);
                expect((err as CustomError).message).toBe('No file uploaded');
                expect((err as CustomError).statusCode).toBe(400);
            }

            // Next should not be called
            expect(mockNext).not.toHaveBeenCalled();
        });

        test('should reject non-PDF files', () => {
            // Set non-PDF mimetype
            mockRequest.file = {
                mimetype: 'image/jpeg',
                originalname: 'test.jpg'
            } as Express.Multer.File;

            // Call middleware and catch the error
            try {
                validateFileUpload(mockRequest as Request, mockResponse as Response, mockNext);
                // If we reach here, the test should fail
                expect('Middleware did not throw an error').toBe('It should have thrown an error');
            } catch (err) {
                // Verify correct error was thrown
                expect(err).toBeInstanceOf(CustomError);
                expect((err as CustomError).message).toBe('Only PDF files are allowed');
                expect((err as CustomError).statusCode).toBe(400);
            }

            // Next should not be called
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('handleValidationErrors', () => {
        test('should pass when no validation errors', () => {
            // Mock empty errors array
            mockValidationResult.mockReturnValue({
                isEmpty: () => true,
                array: () => []
            } as any);

            // Call middleware
            handleValidationErrors(mockRequest as Request, mockResponse as Response, mockNext);

            // Verify next was called without errors
            expect(mockNext).toHaveBeenCalled();
        });

        test('should throw error when validation errors exist', () => {
            // Mock validation errors
            mockValidationResult.mockReturnValue({
                isEmpty: () => false,
                array: () => [
                    { msg: 'Field1 is required' },
                    { msg: 'Field2 is invalid' }
                ]
            } as any);

            // Call middleware and catch the error
            try {
                handleValidationErrors(mockRequest as Request, mockResponse as Response, mockNext);
                // If we reach here, the test should fail
                expect('Middleware did not throw an error').toBe('It should have thrown an error');
            } catch (err) {
                // Verify the error contains validation messages
                expect(err).toBeInstanceOf(CustomError);
                expect((err as CustomError).message).toContain('Field1 is required');
                expect((err as CustomError).message).toContain('Field2 is invalid');
                expect((err as CustomError).statusCode).toBe(400);
            }

            // Next should not be called
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    // Tests for validateDocumentId and validateTotalPages
    describe('validateDocumentId', () => {
        test('should be an array of middleware functions', () => {
            expect(Array.isArray(validateDocumentId)).toBe(true);
            expect(validateDocumentId.length).toBeGreaterThan(0);
        });
    });

    describe('validateTotalPages', () => {
        test('should be an array of middleware functions', () => {
            expect(Array.isArray(validateTotalPages)).toBe(true);
            expect(validateTotalPages.length).toBeGreaterThan(0);
        });
    });
}); 