import { Types } from 'mongoose';
import { DocumentWithTimestamps } from '../../models/Document';

// Factory function to create a mock document
export const createMockDocument = (overrides = {}): Partial<DocumentWithTimestamps> => ({
    _id: new Types.ObjectId(),
    title: 'Test Document',
    description: 'Test Description',
    fileName: 'test.pdf',
    filePath: '/path/to/test.pdf',
    fileType: 'application/pdf',
    metadata: {
        size: 12345,
        uploadedBy: 'test-user',
        version: 1,
        pageCount: 5
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
});

// Mongoose model common mock methods
export const createModelMock = () => ({
    find: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    deleteOne: jest.fn().mockReturnThis(),
    create: jest.fn(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn()
});

// Document model mock
export const DocumentModelMock = {
    ...createModelMock(),
    create: jest.fn().mockImplementation((doc) =>
        Promise.resolve({ ...createMockDocument(), ...doc, _id: new Types.ObjectId() })
    ),
    exec: jest.fn().mockResolvedValue([createMockDocument()])
}; 