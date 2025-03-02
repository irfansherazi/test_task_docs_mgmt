import mongoose from 'mongoose';

// Mock mongoose entirely
jest.mock('mongoose', () => {
    const originalModule = jest.requireActual('mongoose');

    // Create mock functions for all common Mongoose methods
    const mockModel = {
        find: jest.fn().mockReturnThis(),
        findById: jest.fn().mockReturnThis(),
        findOne: jest.fn().mockReturnThis(),
        deleteOne: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation((doc) => Promise.resolve({ ...doc, _id: 'mocked-id' })),
    };

    return {
        ...originalModule,
        connect: jest.fn().mockResolvedValue(undefined),
        model: jest.fn().mockReturnValue(mockModel),
        Schema: jest.fn().mockReturnValue({}),
    };
});

// Mock the fs module for file operations
jest.mock('fs', () => ({
    existsSync: jest.fn().mockReturnValue(true),
    mkdirSync: jest.fn(),
    promises: {
        readFile: jest.fn().mockResolvedValue(Buffer.from('mocked file content')),
        writeFile: jest.fn().mockResolvedValue(undefined),
        unlink: jest.fn().mockResolvedValue(undefined),
    },
}));

// Reset all mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
});

// Close any open handles after all tests
afterAll(() => {
    jest.restoreAllMocks();
}); 