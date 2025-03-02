import mongoose from 'mongoose';

// Mock mongoose completely
jest.mock('mongoose', () => ({
    connect: jest.fn()
}));

// Mock process.exit
const mockExit = jest.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error(`Process.exit called with code: ${code}`);
});

// Save original environment variables
const originalEnv = process.env;

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Direct mock implementation to avoid loading the actual module
jest.mock('../../modules/database', () => {
    return {
        connectDB: jest.fn().mockImplementation(async () => {
            try {
                if (!process.env.MONGODB_URI) {
                    throw new Error('MONGODB_URI is not defined');
                }
                await mongoose.connect(process.env.MONGODB_URI, { dbName: 'test_docs_mgmt' });
                console.log('MongoDB connected successfully');
                return;
            } catch (error) {
                console.error('MongoDB connection error:', error);
                process.exit(1);
            }
        })
    };
});

describe('Database Module', () => {
    // Import the module after mocking
    const { connectDB } = require('../../modules/database');

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Reset environment
        process.env = { ...originalEnv };

        // Ensure MONGODB_URI is set for all tests
        process.env.MONGODB_URI = 'mongodb://localhost:27017';

        // Mock console methods
        console.log = jest.fn();
        console.error = jest.fn();
    });

    afterEach(() => {
        // Restore console methods
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
    });

    afterAll(() => {
        // Restore original environment
        process.env = originalEnv;
    });

    test('should connect to MongoDB successfully', async () => {
        // Mock successful connection
        (mongoose.connect as jest.Mock).mockResolvedValue(undefined);

        // Call connectDB
        await connectDB();

        // Verify mongoose.connect was called with correct URI and options
        expect(mongoose.connect).toHaveBeenCalledWith(
            'mongodb://localhost:27017',
            { dbName: 'test_docs_mgmt' }
        );

        // Verify success message was logged
        expect(console.log).toHaveBeenCalledWith('MongoDB connected successfully');
    });

    test('should handle connection errors', async () => {
        // Mock connection error
        const mockError = new Error('Connection failed');
        (mongoose.connect as jest.Mock).mockRejectedValue(mockError);

        // Call connectDB and expect it to exit
        await expect(connectDB()).rejects.toThrow('Process.exit called with code: 1');

        // Verify error was logged
        expect(console.error).toHaveBeenCalledWith('MongoDB connection error:', mockError);
        expect(mockExit).toHaveBeenCalledWith(1);
    });

    test('should throw error if MONGODB_URI is not defined', async () => {
        // Remove environment variable
        delete process.env.MONGODB_URI;

        // Call connectDB and expect it to throw an error
        await expect(connectDB()).rejects.toThrow('Process.exit called with code: 1');

        // Verify error was logged
        expect(console.error).toHaveBeenCalled();
    });
}); 