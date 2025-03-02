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

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Admin user email
 *         password:
 *           type: string
 *           format: password
 *           description: Admin user password
 *     LoginResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: JWT token for authentication
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: User ID
 *             email:
 *               type: string
 *               description: User email
 *             name:
 *               type: string
 *               description: User name
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login as admin
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *       400:
 *         description: Validation error
 */

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