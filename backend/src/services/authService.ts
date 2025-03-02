import jwt from 'jsonwebtoken';
import { CustomError } from '../utils/errors';
import User, { IUser } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
        name: string;
    };
}

interface JwtPayload {
    id: string;
    email: string;
    role: string;
}

export const login = async (
    email: string,
    password: string
): Promise<AuthResponse> => {
    // Find admin user by email
    const user = await User.findOne({ email, role: 'admin' });
    if (!user) {
        throw new CustomError('Invalid credentials', 401);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        throw new CustomError('Invalid credentials', 401);
    }

    // Generate JWT token
    const token = generateToken(user);

    return {
        token,
        user: {
            id: user._id.toString(),
            email: user.email,
            name: user.name
        }
    };
};

export const verifyToken = (token: string): JwtPayload => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded as JwtPayload;
    } catch (error) {
        throw new CustomError('Invalid token', 401);
    }
};

const generateToken = (user: IUser): string => {
    const payload: JwtPayload = {
        id: user._id.toString(),
        email: user.email,
        role: user.role
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}; 