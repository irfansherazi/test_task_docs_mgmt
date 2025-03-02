import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import {
    uploadDocument,
    getDocuments,
    getExtractions,
    getDocumentMetadata,
    deleteDocumentHandler,
    getDocumentFile
} from '../../controllers/documentController';
import * as documentService from '../../services/documentService';
import { CustomError } from '../../utils/errors';

// Mock documentService
jest.mock('../../services/documentService', () => ({
    createDocument: jest.fn(),
    getAllDocuments: jest.fn(),
    getDocumentExtractions: jest.fn(),
    getDocumentMetadata: jest.fn(),
    deleteDocument: jest.fn()
}));

// Mock fs module
jest.mock('fs', () => ({
    existsSync: jest.fn(),
    mkdirSync: jest.fn()
}));

// Mock path module
jest.mock('path', () => ({
    join: jest.fn(),
    basename: jest.fn()
}));

describe('Document Controller', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.Mock;

    beforeEach(() => {
        mockRequest = {
            file: {
                fieldname: 'file',
                originalname: 'file.pdf',
                encoding: '7bit',
                mimetype: 'application/pdf',
                destination: '/tmp/uploads',
                filename: 'file.pdf',
                path: '/tmp/uploads/file.pdf',
                size: 1024,
                stream: {} as any,
                buffer: Buffer.from('test')
            } as Express.Multer.File,
            params: { id: 'test-id' }
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
            setHeader: jest.fn(),
            sendFile: jest.fn()
        };
        mockNext = jest.fn();

        // Clear all mocks
        jest.clearAllMocks();
    });

    describe('uploadDocument', () => {
        test('should upload document and return metadata', async () => {
            const mockMetadata = { _id: 'test-id', fileName: 'file.pdf' };
            (documentService.createDocument as jest.Mock).mockResolvedValue(mockMetadata);

            await uploadDocument(mockRequest as Request, mockResponse as Response, mockNext);

            expect(documentService.createDocument).toHaveBeenCalledWith(mockRequest.file);
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(mockMetadata);
        });

        test('should handle missing file error', async () => {
            mockRequest.file = undefined;

            await uploadDocument(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(CustomError));
            expect(mockNext.mock.calls[0][0].message).toBe('No file uploaded');
            expect(mockNext.mock.calls[0][0].statusCode).toBe(400);
        });

        test('should handle service errors', async () => {
            const mockError = new Error('Service error');
            (documentService.createDocument as jest.Mock).mockRejectedValue(mockError);

            await uploadDocument(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });

    describe('getDocuments', () => {
        test('should get all documents', async () => {
            const mockDocuments = [{ _id: 'test-id', fileName: 'file.pdf' }];
            (documentService.getAllDocuments as jest.Mock).mockResolvedValue(mockDocuments);

            await getDocuments(mockRequest as Request, mockResponse as Response, mockNext);

            expect(documentService.getAllDocuments).toHaveBeenCalled();
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(mockDocuments);
        });

        test('should handle service errors', async () => {
            const mockError = new Error('Service error');
            (documentService.getAllDocuments as jest.Mock).mockRejectedValue(mockError);

            await getDocuments(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });

    describe('getExtractions', () => {
        test('should get document extractions', async () => {
            const mockExtractions = { fields: {}, tables: [] };
            (documentService.getDocumentExtractions as jest.Mock).mockResolvedValue(mockExtractions);

            await getExtractions(mockRequest as Request, mockResponse as Response, mockNext);

            expect(documentService.getDocumentExtractions).toHaveBeenCalledWith('test-id');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(mockExtractions);
        });

        test('should handle service errors', async () => {
            const mockError = new Error('Service error');
            (documentService.getDocumentExtractions as jest.Mock).mockRejectedValue(mockError);

            await getExtractions(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });

    describe('getDocumentMetadata', () => {
        test('should get document metadata', async () => {
            const mockMetadata = { _id: 'test-id', fileName: 'file.pdf' };
            (documentService.getDocumentMetadata as jest.Mock).mockResolvedValue(mockMetadata);

            await getDocumentMetadata(mockRequest as Request, mockResponse as Response, mockNext);

            expect(documentService.getDocumentMetadata).toHaveBeenCalledWith('test-id');
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(mockMetadata);
        });

        test('should handle service errors', async () => {
            const mockError = new Error('Service error');
            (documentService.getDocumentMetadata as jest.Mock).mockRejectedValue(mockError);

            await getDocumentMetadata(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });

    describe('deleteDocumentHandler', () => {
        test('should delete document', async () => {
            await deleteDocumentHandler(mockRequest as Request, mockResponse as Response, mockNext);

            expect(documentService.deleteDocument).toHaveBeenCalledWith('test-id');
            expect(mockResponse.status).toHaveBeenCalledWith(204);
            expect(mockResponse.send).toHaveBeenCalled();
        });

        test('should handle service errors', async () => {
            const mockError = new Error('Service error');
            (documentService.deleteDocument as jest.Mock).mockRejectedValue(mockError);

            await deleteDocumentHandler(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });

    describe('getDocumentFile', () => {
        test('should get document file', async () => {
            const mockMetadata = {
                _id: 'test-id',
                fileName: 'file.pdf',
                filePath: '/path/to/file.pdf'
            };
            (documentService.getDocumentMetadata as jest.Mock).mockResolvedValue(mockMetadata);
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (path.join as jest.Mock).mockReturnValue('/absolute/path/to/file.pdf');
            (path.basename as jest.Mock).mockReturnValue('file.pdf');

            await getDocumentFile(mockRequest as Request, mockResponse as Response, mockNext);

            expect(documentService.getDocumentMetadata).toHaveBeenCalledWith('test-id');
            expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
            expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining('file.pdf'));
            expect(mockResponse.sendFile).toHaveBeenCalled();
        });

        test('should handle missing file path', async () => {
            const mockMetadata = {
                _id: 'test-id',
                fileName: 'file.pdf'
                // filePath is missing
            };
            (documentService.getDocumentMetadata as jest.Mock).mockResolvedValue(mockMetadata);

            await getDocumentFile(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(CustomError));
            expect(mockNext.mock.calls[0][0].message).toBe('File path not found');
            expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
        });

        test('should handle file not found on disk', async () => {
            const mockMetadata = {
                _id: 'test-id',
                fileName: 'file.pdf',
                filePath: '/path/to/file.pdf'
            };
            (documentService.getDocumentMetadata as jest.Mock).mockResolvedValue(mockMetadata);
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (path.join as jest.Mock).mockReturnValue('/absolute/path/to/file.pdf');
            (path.basename as jest.Mock).mockReturnValue('file.pdf');

            await getDocumentFile(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(expect.any(CustomError));
            expect(mockNext.mock.calls[0][0].message).toBe('File not found on disk');
            expect(mockNext.mock.calls[0][0].statusCode).toBe(404);
        });

        test('should handle file sending error', async () => {
            const mockMetadata = {
                _id: 'test-id',
                fileName: 'file.pdf',
                filePath: '/path/to/file.pdf'
            };
            (documentService.getDocumentMetadata as jest.Mock).mockResolvedValue(mockMetadata);
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (path.join as jest.Mock).mockReturnValue('/absolute/path/to/file.pdf');
            (path.basename as jest.Mock).mockReturnValue('file.pdf');

            (mockResponse.sendFile as jest.Mock).mockImplementation((path, callback) => {
                callback(new Error('Error sending file'));
            });

            await getDocumentFile(mockRequest as Request, mockResponse as Response, mockNext);

            // The next should be called in the callback
            expect(mockNext).toHaveBeenCalledWith(expect.any(CustomError));
            expect(mockNext.mock.calls[0][0].message).toBe('Error sending file');
            expect(mockNext.mock.calls[0][0].statusCode).toBe(500);
        });

        test('should handle service errors', async () => {
            const mockError = new Error('Service error');
            (documentService.getDocumentMetadata as jest.Mock).mockRejectedValue(mockError);

            await getDocumentFile(mockRequest as Request, mockResponse as Response, mockNext);

            expect(mockNext).toHaveBeenCalledWith(mockError);
        });
    });
}); 