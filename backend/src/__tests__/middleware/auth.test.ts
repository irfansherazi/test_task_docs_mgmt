import { Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { verifyToken } from '../../services/authService';
import User from '../../models/User';
import { CustomError } from '../../utils/errors';

// Mock authService
jest.mock('../../services/authService', () => ({
    verifyToken: jest.fn()
}));

// Mock User model
jest.mock('../../models/User', () => ({
    __esModule: true,
    default: {
        findById: jest.fn()
    }
}));

describe('Auth Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.Mock;

    beforeEach(() => {
        mockRequest = {
            headers: {
                authorization: 'Bearer valid-token'
            }
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        mockNext = jest.fn();

        jest.clearAllMocks();
    });

    describe('authenticate', () => {
        test('should authenticate with valid token', async () => {
            // Mock decoded token
            const mockDecodedToken = { id: 'user-id' };
            (verifyToken as jest.Mock).mockReturnValue(mockDecodedToken);

            // Mock user
            const mockUser = { _id: 'user-id', name: 'Test User', role: 'admin' };
            (User.findById as jest.Mock).mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });

            await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

            // Verify token was validated
            expect(verifyToken).toHaveBeenCalledWith('valid-token');

            // Verify user was fetched
            expect(User.findById).toHaveBeenCalledWith('user-id');

            // Verify user was added to request
            expect(mockRequest.user).toEqual(mockUser);

            // Verify next was called
            expect(mockNext).toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
        });

        test('should reject requests without authorization header', async () => {
            // Remove authorization header
            mockRequest.headers = {};

            await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

            // Verify error handling
            expect(mockNext).toHaveBeenCalledWith(expect.any(CustomError));
            expect(mockNext.mock.calls[0][0].message).toBe('No token provided');
            expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
        });

        test('should reject requests with malformed authorization header', async () => {
            // Invalid header format
            mockRequest.headers = { authorization: 'invalid-format' };

            await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

            // Verify error handling
            expect(mockNext).toHaveBeenCalledWith(expect.any(CustomError));
            expect(mockNext.mock.calls[0][0].message).toBe('No token provided');
            expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
        });

        test('should handle invalid token', async () => {
            // Mock verifyToken to throw error
            (verifyToken as jest.Mock).mockImplementation(() => {
                throw new CustomError('Invalid token', 401);
            });

            await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

            // Verify error was passed to next
            expect(mockNext).toHaveBeenCalledWith(expect.any(CustomError));
            expect(mockNext.mock.calls[0][0].message).toBe('Invalid token');
            expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
        });

        test('should handle user not found', async () => {
            // Mock decoded token
            const mockDecodedToken = { id: 'user-id' };
            (verifyToken as jest.Mock).mockReturnValue(mockDecodedToken);

            // Mock user not found
            (User.findById as jest.Mock).mockReturnValue({
                select: jest.fn().mockResolvedValue(null)
            });

            await authenticate(mockRequest as Request, mockResponse as Response, mockNext);

            // Verify error was passed to next
            expect(mockNext).toHaveBeenCalledWith(expect.any(CustomError));
            expect(mockNext.mock.calls[0][0].message).toBe('User not found');
            expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
        });
    });

    describe('authorize', () => {
        test('should allow access to authorized roles', () => {
            // Set user with admin role
            mockRequest.user = { role: 'admin' };

            // Create middleware for admin role
            const authMiddleware = authorize('admin');

            // Execute middleware
            authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

            // Verify next was called without error
            expect(mockNext).toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
        });

        test('should deny access to unauthorized roles', () => {
            // Set user with different role
            mockRequest.user = { role: 'user' };

            // Create middleware for admin role
            const authMiddleware = authorize('admin');

            // Execute middleware
            authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

            // Verify error was passed to next
            expect(mockNext).toHaveBeenCalledWith(expect.any(CustomError));
            expect(mockNext.mock.calls[0][0].message).toBe('Not authorized to access this route');
            expect(mockNext.mock.calls[0][0].statusCode).toBe(403);
        });

        test('should handle missing user in request', () => {
            // No user in request
            mockRequest.user = undefined;

            // Create middleware for admin role
            const authMiddleware = authorize('admin');

            // Execute middleware
            authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

            // Verify error was passed to next
            expect(mockNext).toHaveBeenCalledWith(expect.any(CustomError));
            expect(mockNext.mock.calls[0][0].message).toBe('Not authorized');
            expect(mockNext.mock.calls[0][0].statusCode).toBe(401);
        });

        test('should allow multiple roles', () => {
            // Set user with editor role
            mockRequest.user = { role: 'editor' };

            // Create middleware for multiple roles
            const authMiddleware = authorize('admin', 'editor', 'manager');

            // Execute middleware
            authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

            // Verify next was called without error
            expect(mockNext).toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
        });
    });
}); 