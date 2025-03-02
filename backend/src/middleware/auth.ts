import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService';
import { CustomError } from '../utils/errors';
import User from '../models/User';

declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new CustomError('No token provided', 401);
        }

        // Verify token
        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);

        // Get user from token
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            throw new CustomError('User not found', 401);
        }

        // Add user to request
        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};

export const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new CustomError('Not authorized', 401));
        }

        if (!roles.includes(req.user.role)) {
            return next(
                new CustomError('Not authorized to access this route', 403)
            );
        }

        next();
    };
}; 