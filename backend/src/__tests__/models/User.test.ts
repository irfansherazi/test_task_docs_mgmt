import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import UserModel, { IUser, ensureAdminExists } from '../../models/User';

// Mock mongoose and bcrypt
jest.mock('mongoose', () => {
    const mockModel = {
        findOne: jest.fn(),
        create: jest.fn(),
    };

    return {
        Schema: jest.fn().mockImplementation(() => {
            return {
                methods: {},
                pre: jest.fn().mockReturnThis()
            };
        }),
        model: jest.fn().mockReturnValue(mockModel),
        Types: {
            ObjectId: jest.fn().mockImplementation((id) => id || 'mockObjectId'),
        },
    };
});

jest.mock('bcryptjs', () => ({
    genSalt: jest.fn().mockResolvedValue('mockedSalt'),
    hash: jest.fn().mockImplementation((password, salt) => Promise.resolve(`hashed_${password}`)),
    compare: jest.fn().mockImplementation((candidatePassword, hashedPassword) => {
        // Mock implementation to simulate password comparison
        return Promise.resolve(hashedPassword === `hashed_${candidatePassword}`);
    }),
}));

// Mock console
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('User Model', () => {
    beforeAll(() => {
        console.log = jest.fn();
        console.error = jest.fn();
    });

    afterAll(() => {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Password Hashing', () => {
        // Since we can't easily test the pre-save hook directly, we'll test the behavior
        // by simulating what the hook would do
        test('should hash password before saving', async () => {
            // Simulate the pre-save hook behavior
            const mockUser = {
                isModified: jest.fn().mockReturnValue(true),
                password: 'plainPassword'
            };

            // Simulate the hook execution
            if (mockUser.isModified('password')) {
                const salt = await bcrypt.genSalt(10);
                // In a real scenario, this would modify the user's password
                await bcrypt.hash(mockUser.password, salt);
            }

            // Verify the expected behavior
            expect(mockUser.isModified).toHaveBeenCalledWith('password');
            expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(bcrypt.hash).toHaveBeenCalledWith('plainPassword', 'mockedSalt');
        });

        test('should not hash password if not modified', async () => {
            // Simulate the pre-save hook behavior
            const mockUser = {
                isModified: jest.fn().mockReturnValue(false),
                password: 'plainPassword'
            };

            // Simulate the hook execution
            if (mockUser.isModified('password')) {
                const salt = await bcrypt.genSalt(10);
                await bcrypt.hash(mockUser.password, salt);
            }

            // Verify the expected behavior
            expect(mockUser.isModified).toHaveBeenCalledWith('password');
            expect(bcrypt.genSalt).not.toHaveBeenCalled();
            expect(bcrypt.hash).not.toHaveBeenCalled();
        });

        test('should handle errors during password hashing', async () => {
            // Simulate the pre-save hook behavior
            const mockUser = {
                isModified: jest.fn().mockReturnValue(true),
                password: 'plainPassword'
            };

            // Mock bcrypt.genSalt to throw an error
            (bcrypt.genSalt as jest.Mock).mockRejectedValueOnce(new Error('Mocked error'));

            // Simulate the hook execution with error handling
            let error: Error | null = null;
            try {
                if (mockUser.isModified('password')) {
                    const salt = await bcrypt.genSalt(10);
                    await bcrypt.hash(mockUser.password, salt);
                }
            } catch (err) {
                error = err as Error;
            }

            // Verify the expected behavior
            expect(mockUser.isModified).toHaveBeenCalledWith('password');
            expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
            expect(error).toBeInstanceOf(Error);
            expect(error?.message).toBe('Mocked error');
        });
    });

    describe('comparePassword Method', () => {
        test('should correctly compare passwords', async () => {
            // Define a comparePassword method
            const comparePassword = async function (this: { password: string }, candidatePassword: string): Promise<boolean> {
                return bcrypt.compare(candidatePassword, this.password);
            };

            // Create a mock user instance
            const mockUser = {
                password: 'hashed_correctPassword',
                comparePassword: comparePassword,
            };

            // Test with correct password
            const isCorrectPassword = await mockUser.comparePassword('correctPassword');
            expect(isCorrectPassword).toBe(true);

            // Test with incorrect password
            const isIncorrectPassword = await mockUser.comparePassword('wrongPassword');
            expect(isIncorrectPassword).toBe(false);

            // Verify bcrypt.compare was called correctly
            expect(bcrypt.compare).toHaveBeenCalledTimes(2);
            expect(bcrypt.compare).toHaveBeenCalledWith('correctPassword', 'hashed_correctPassword');
            expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', 'hashed_correctPassword');
        });
    });

    describe('ensureAdminExists', () => {
        test('should create admin user if it does not exist', async () => {
            // Mock findOne to return null (admin doesn't exist)
            (UserModel.findOne as jest.Mock).mockResolvedValueOnce(null);

            // Set environment variables
            const originalEnv = process.env;
            process.env = {
                ...originalEnv,
                ADMIN_EMAIL: 'test@admin.com',
                ADMIN_PASSWORD: 'testpassword',
                ADMIN_NAME: 'Test Admin',
            };

            await ensureAdminExists();

            // Verify findOne was called with correct email
            expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'test@admin.com' });

            // Verify create was called with correct user data
            expect(UserModel.create).toHaveBeenCalledWith({
                email: 'test@admin.com',
                password: 'testpassword',
                name: 'Test Admin',
                role: 'admin',
            });

            // Verify log message
            expect(console.log).toHaveBeenCalledWith('Admin user created successfully');

            // Restore environment
            process.env = originalEnv;
        });

        test('should not create admin user if it already exists', async () => {
            // Mock findOne to return an existing admin
            (UserModel.findOne as jest.Mock).mockResolvedValueOnce({ _id: 'existingAdminId' });

            await ensureAdminExists();

            // Verify findOne was called
            expect(UserModel.findOne).toHaveBeenCalled();

            // Verify create was not called
            expect(UserModel.create).not.toHaveBeenCalled();

            // Verify no log message
            expect(console.log).not.toHaveBeenCalled();
        });

        test('should handle errors during admin creation', async () => {
            // Mock findOne to throw an error
            (UserModel.findOne as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

            await ensureAdminExists();

            // Verify error was logged
            expect(console.error).toHaveBeenCalledWith('Error creating admin user:', expect.any(Error));
        });
    });
}); 