import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { login, verifyToken } from '../../services/authService';
import User from '../../models/User';
import { CustomError } from '../../utils/errors';

// Mock User model
jest.mock('../../models/User', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn()
    }
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn()
}));

describe('Auth Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('login', () => {
        test('should return token and user info for valid credentials', async () => {
            // Mock user
            const mockUser = {
                _id: new Types.ObjectId(),
                email: 'admin@example.com',
                name: 'Admin User',
                role: 'admin',
                comparePassword: jest.fn().mockResolvedValue(true)
            };

            // Mock User.findOne
            (User.findOne as jest.Mock).mockResolvedValue(mockUser);

            // Call login
            const result = await login('admin@example.com', 'password123');

            // Assertions
            expect(User.findOne).toHaveBeenCalledWith({ email: 'admin@example.com', role: 'admin' });
            expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
            expect(jwt.sign).toHaveBeenCalled();
            expect(result).toEqual({
                token: 'mock-token',
                user: {
                    id: mockUser._id.toString(),
                    email: mockUser.email,
                    name: mockUser.name
                }
            });
        });

        test('should throw error when user not found', async () => {
            // Mock User.findOne to return null
            (User.findOne as jest.Mock).mockResolvedValue(null);

            // Call login and expect error
            await expect(login('nonexistent@example.com', 'password123')).rejects.toThrow(
                new CustomError('Invalid credentials', 401)
            );

            // Verify mock calls
            expect(User.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com', role: 'admin' });
        });

        test('should throw error when password is invalid', async () => {
            // Mock user with invalid password
            const mockUser = {
                _id: new Types.ObjectId(),
                email: 'admin@example.com',
                name: 'Admin User',
                role: 'admin',
                comparePassword: jest.fn().mockResolvedValue(false) // Invalid password
            };

            // Mock User.findOne
            (User.findOne as jest.Mock).mockResolvedValue(mockUser);

            // Call login and expect error
            await expect(login('admin@example.com', 'wrong-password')).rejects.toThrow(
                new CustomError('Invalid credentials', 401)
            );

            // Verify mock calls
            expect(User.findOne).toHaveBeenCalledWith({ email: 'admin@example.com', role: 'admin' });
            expect(mockUser.comparePassword).toHaveBeenCalledWith('wrong-password');
        });
    });

    describe('verifyToken', () => {
        test('should return decoded payload for valid token', () => {
            // Mock payload
            const mockPayload = {
                id: 'user-id',
                email: 'admin@example.com',
                role: 'admin'
            };

            // Mock jwt.verify
            (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

            // Call verifyToken
            const result = verifyToken('valid-token');

            // Assertions
            expect(jwt.verify).toHaveBeenCalled();
            expect(result).toEqual(mockPayload);
        });

        test('should throw error for invalid token', () => {
            // Mock jwt.verify to throw error
            (jwt.verify as jest.Mock).mockImplementation(() => {
                throw new Error('invalid token');
            });

            // Call verifyToken and expect error
            expect(() => verifyToken('invalid-token')).toThrow(
                new CustomError('Invalid token', 401)
            );

            // Verify mock calls
            expect(jwt.verify).toHaveBeenCalled();
        });
    });
}); 