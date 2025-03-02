import fs from 'fs';
import { Types } from 'mongoose';
import { cleanupOrphanedDocuments } from '../../utils/documentCleanup';
import DocumentModel from '../../models/Document';
import { createMockDocument } from '../mocks/models.mock';

// Mock the Document model
jest.mock('../../models/Document', () => ({
    __esModule: true,
    default: {
        find: jest.fn(),
        deleteOne: jest.fn()
    }
}));

// Mock fs
jest.mock('fs', () => ({
    existsSync: jest.fn()
}));

describe('Document Cleanup Utility', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should remove documents that do not have corresponding files', async () => {
        // Set up mocks
        const mockDocuments = [
            createMockDocument({ _id: new Types.ObjectId(), filePath: '/path/to/existing.pdf' }),
            createMockDocument({ _id: new Types.ObjectId(), filePath: '/path/to/missing.pdf' })
        ];

        // Mock the find and lean methods
        (DocumentModel.find as jest.Mock).mockReturnValue({
            lean: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockDocuments)
            })
        });

        // Mock the deleteOne method
        (DocumentModel.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

        // Mock fs.existsSync to return true for one file and false for the other
        (fs.existsSync as jest.Mock).mockImplementation((path: string) => {
            return path === '/path/to/existing.pdf';
        });

        // Call the function
        const removedCount = await cleanupOrphanedDocuments();

        // Assertions
        expect(fs.existsSync).toHaveBeenCalledTimes(2);
        expect(DocumentModel.deleteOne).toHaveBeenCalledTimes(1);
        expect(DocumentModel.deleteOne).toHaveBeenCalledWith({ _id: mockDocuments[1]._id });
        expect(removedCount).toBe(1);
    });

    test('should not remove any documents if all files exist', async () => {
        // Set up mocks
        const mockDocuments = [
            createMockDocument({ _id: new Types.ObjectId(), filePath: '/path/to/file1.pdf' }),
            createMockDocument({ _id: new Types.ObjectId(), filePath: '/path/to/file2.pdf' })
        ];

        // Mock the find and lean methods
        (DocumentModel.find as jest.Mock).mockReturnValue({
            lean: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue(mockDocuments)
            })
        });

        // Mock fs.existsSync to always return true
        (fs.existsSync as jest.Mock).mockReturnValue(true);

        // Call the function
        const removedCount = await cleanupOrphanedDocuments();

        // Assertions
        expect(fs.existsSync).toHaveBeenCalledTimes(2);
        expect(DocumentModel.deleteOne).not.toHaveBeenCalled();
        expect(removedCount).toBe(0);
    });

    test('should handle errors gracefully', async () => {
        // Mock the find method to throw an error
        (DocumentModel.find as jest.Mock).mockImplementation(() => {
            throw new Error('Database error');
        });

        // Spy on console.error
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        // Call the function
        const removedCount = await cleanupOrphanedDocuments();

        // Assertions
        expect(consoleSpy).toHaveBeenCalledWith('Error during document cleanup:', expect.any(Error));
        expect(removedCount).toBe(0);

        // Restore console.error
        consoleSpy.mockRestore();
    });
}); 