import express, { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';
import { login } from '../services/authService';

interface LoginRequest extends Request {
    body: {
        email: string;
        password: string;
    }
}

const router = express.Router();

const validateLogin = [
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
    handleValidationErrors
];

router.post(
    '/login',
    validateLogin,
    async (req: LoginRequest, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body;
            const result = await login(email, password);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
);

export default router; 