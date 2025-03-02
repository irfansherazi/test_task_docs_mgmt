import { Types } from 'mongoose';
import fs from 'fs';
import path from 'path';
import {
    getAllDocuments,
    getDocumentMetadata,
    getDocumentExtractions,
    createDocument,
    deleteDocument
} from '../../services/documentService';
import DocumentModel from '../../models/Document';
import ExtractionModel from '../../models/Extraction';
import { createMockDocument } from '../mocks/models.mock';
import { CustomError } from '../../utils/errors';
import { generateMockExtractions } from '../../utils/mockData';

// Mock the models
jest.mock('../../models/Document', () => ({
    __esModule: true,
    default: {
        find: jest.fn(),
        findById: jest.fn(),
        deleteOne: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({ deletedCount: 1 })
        }),
        create: jest.fn()
    }
}));

jest.mock('../../models/Extraction', () => ({
    __esModule: true,
    default: {
        findOne: jest.fn(),
        deleteOne: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({ deletedCount: 1 })
        }),
        create: jest.fn()
    }
}));

// Mock fs
jest.mock('fs', () => ({
    existsSync: jest.fn().mockReturnValue(true)
}));

// Mock uuid
jest.mock('uuid', () => ({
    v4: jest.fn().mockReturnValue('mock-uuid-1234')
}));

// Mock path
jest.mock('path', () => ({
    basename: jest.fn((p) => p.split('/').pop())
}));

// Don't mock the documentService - test the actual implementation
// jest.mock('../../services/documentService', () => {
//    ...
// });

describe('Document Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAllDocuments', () => {
        test('should return all documents', async () => {
            const mockDocuments = [
                createMockDocument({ _id: new Types.ObjectId() }),
                createMockDocument({ _id: new Types.ObjectId() })
            ];

            // Ensure _id is defined in the mock documents
            const mockDoc1 = mockDocuments[0];
            const mockDoc2 = mockDocuments[1];

            if (!mockDoc1._id || !mockDoc2._id) {
                throw new Error('Mock document _id is undefined');
            }

            (DocumentModel.find as jest.Mock).mockReturnValue({
                lean: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue(mockDocuments)
                })
            });

            const result = await getAllDocuments();

            expect(DocumentModel.find).toHaveBeenCalled();
            expect(result).toHaveLength(2);
            expect(result[0]).toHaveProperty('id', mockDoc1._id.toString());
            expect(result[0]).toHaveProperty('fileName', mockDoc1.fileName);
        });

        test('should return empty array when no documents exist', async () => {
            (DocumentModel.find as jest.Mock).mockReturnValue({
                lean: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue([])
                })
            });

            const result = await getAllDocuments();

            expect(DocumentModel.find).toHaveBeenCalled();
            expect(result).toEqual([]);
        });
    });

    describe('createDocument', () => {
        test('should create a document and its extractions', async () => {
            // Mock file
            const mockFile = {
                originalname: 'test.pdf',
                path: '/uploads/test.pdf',
                mimetype: 'application/pdf',
                size: 12345
            } as Express.Multer.File;

            // Mock document
            const mockDocument = createMockDocument({
                _id: new Types.ObjectId(),
                title: mockFile.originalname,
                fileName: mockFile.originalname,
                filePath: mockFile.path,
                fileType: mockFile.mimetype
            });

            if (!mockDocument._id) {
                throw new Error('Mock document _id is undefined');
            }

            // Mock extractions
            const mockExtractions = generateMockExtractions(mockDocument._id.toString());

            // Mock Document.create
            (DocumentModel.create as jest.Mock).mockResolvedValue(mockDocument);

            // Mock Extraction.create
            (ExtractionModel.create as jest.Mock).mockResolvedValue({
                _id: new Types.ObjectId(),
                documentId: mockDocument._id,
                extractions: mockExtractions.extractions
            });

            const result = await createDocument(mockFile);

            expect(DocumentModel.create).toHaveBeenCalledWith({
                title: mockFile.originalname,
                description: 'Uploaded document',
                fileName: mockFile.originalname,
                filePath: mockFile.path,
                fileType: mockFile.mimetype,
                metadata: {
                    size: mockFile.size,
                    uploadedBy: 'system',
                    version: 1,
                    pageCount: 0
                }
            });

            expect(ExtractionModel.create).toHaveBeenCalled();
            expect(result).toHaveProperty('id', mockDocument._id.toString());
            expect(result).toHaveProperty('fileName', mockFile.originalname);
        });

        test('should throw an error if no file is provided', async () => {
            await expect(createDocument(null as unknown as Express.Multer.File))
                .rejects.toThrow(new CustomError('No file uploaded', 400));
        });

        test('should throw an error if file is not a PDF', async () => {
            const mockFile = {
                originalname: 'test.doc',
                path: '/uploads/test.doc',
                mimetype: 'application/msword',
                size: 12345
            } as Express.Multer.File;

            await expect(createDocument(mockFile))
                .rejects.toThrow(new CustomError('Only PDF files are allowed', 400));
        });
    });

    describe('getDocumentMetadata', () => {
        test('should return document metadata when document exists', async () => {
            const mockDocument = createMockDocument({ _id: new Types.ObjectId() });

            if (!mockDocument._id) {
                throw new Error('Mock document _id is undefined');
            }

            const documentId = mockDocument._id.toString();

            (DocumentModel.findById as jest.Mock).mockReturnValue({
                lean: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue(mockDocument)
                })
            });

            const result = await getDocumentMetadata(documentId);

            expect(DocumentModel.findById).toHaveBeenCalledWith(documentId);
            expect(fs.existsSync).toHaveBeenCalledWith(mockDocument.filePath);
            expect(result).toHaveProperty('id', documentId);
            expect(result).toHaveProperty('fileName', mockDocument.fileName);
        });

        test('should throw an error when document does not exist', async () => {
            const documentId = new Types.ObjectId().toString();

            (DocumentModel.findById as jest.Mock).mockReturnValue({
                lean: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue(null)
                })
            });

            await expect(getDocumentMetadata(documentId)).rejects.toThrow(
                new CustomError('Document not found', 404)
            );
        });

        test('should throw an error when file does not exist', async () => {
            const mockDocument = createMockDocument({ _id: new Types.ObjectId() });

            if (!mockDocument._id) {
                throw new Error('Mock document _id is undefined');
            }

            const documentId = mockDocument._id.toString();

            (DocumentModel.findById as jest.Mock).mockReturnValue({
                lean: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue(mockDocument)
                })
            });

            (fs.existsSync as jest.Mock).mockReturnValue(false);

            await expect(getDocumentMetadata(documentId)).rejects.toThrow(
                new CustomError('Document file not found on disk', 404)
            );
        });
    });

    describe('getDocumentExtractions', () => {
        test('should return document extractions when document and extractions exist', async () => {
            const mockDocument = createMockDocument({
                _id: new Types.ObjectId(),
                metadata: {
                    size: 12345,
                    uploadedBy: 'test-user',
                    version: 1,
                    pageCount: 5
                }
            });

            if (!mockDocument._id) {
                throw new Error('Mock document _id is undefined');
            }

            const documentId = mockDocument._id.toString();

            // Mock extractions
            const mockExtractions = {
                _id: new Types.ObjectId(),
                documentId: mockDocument._id,
                extractions: [
                    { id: 'ext1', text: 'Sample text 1', pageNumber: 2 },
                    { id: 'ext2', text: 'Sample text 2', pageNumber: 1 }
                ]
            };

            (DocumentModel.findById as jest.Mock).mockReturnValue({
                lean: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue(mockDocument)
                })
            });

            (ExtractionModel.findOne as jest.Mock).mockReturnValue({
                lean: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue(mockExtractions)
                })
            });

            // IMPORTANT: Ensure file exists check passes
            (fs.existsSync as jest.Mock).mockReturnValue(true);

            const result = await getDocumentExtractions(documentId);

            expect(DocumentModel.findById).toHaveBeenCalledWith(documentId);
            expect(ExtractionModel.findOne).toHaveBeenCalledWith({ documentId: mockDocument._id });
            expect(result).toHaveProperty('documentId', documentId);
            expect(result).toHaveProperty('extractions');
            expect(result.extractions).toHaveLength(2);
            // Should be sorted by page number
            expect(result.extractions[0].pageNumber).toBe(1);
            expect(result.extractions[1].pageNumber).toBe(2);
            expect(result).toHaveProperty('totalPages', 5);
        });

        test('should throw an error when document does not exist', async () => {
            const documentId = new Types.ObjectId().toString();

            (DocumentModel.findById as jest.Mock).mockReturnValue({
                lean: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue(null)
                })
            });

            await expect(getDocumentExtractions(documentId)).rejects.toThrow(
                new CustomError('Document not found', 404)
            );
        });

        test('should throw an error when file does not exist', async () => {
            const mockDocument = createMockDocument({ _id: new Types.ObjectId() });

            if (!mockDocument._id) {
                throw new Error('Mock document _id is undefined');
            }

            const documentId = mockDocument._id.toString();

            (DocumentModel.findById as jest.Mock).mockReturnValue({
                lean: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue(mockDocument)
                })
            });

            (fs.existsSync as jest.Mock).mockReturnValue(false);

            await expect(getDocumentExtractions(documentId)).rejects.toThrow(
                new CustomError('Document file not found on disk', 404)
            );
        });

        test('should throw an error when no extractions exist for the document', async () => {
            const mockDocument = createMockDocument({ _id: new Types.ObjectId() });

            if (!mockDocument._id) {
                throw new Error('Mock document _id is undefined');
            }

            const documentId = mockDocument._id.toString();

            (DocumentModel.findById as jest.Mock).mockReturnValue({
                lean: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue(mockDocument)
                })
            });

            // IMPORTANT: Ensure file exists check passes
            (fs.existsSync as jest.Mock).mockReturnValue(true);

            (ExtractionModel.findOne as jest.Mock).mockReturnValue({
                lean: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue(null)
                })
            });

            await expect(getDocumentExtractions(documentId)).rejects.toThrow(
                new CustomError('No extractions found for this document', 404)
            );
        });

        test('should use default page count when document metadata does not specify it', async () => {
            const mockDocument = createMockDocument({
                _id: new Types.ObjectId(),
                metadata: {
                    size: 12345,
                    uploadedBy: 'test-user',
                    version: 1,
                    pageCount: 0 // No page count
                }
            });

            if (!mockDocument._id) {
                throw new Error('Mock document _id is undefined');
            }

            const documentId = mockDocument._id.toString();

            // Mock extractions
            const mockExtractions = {
                _id: new Types.ObjectId(),
                documentId: mockDocument._id,
                extractions: [
                    { id: 'ext1', text: 'Sample text 1', pageNumber: 1 }
                ]
            };

            (DocumentModel.findById as jest.Mock).mockReturnValue({
                lean: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue(mockDocument)
                })
            });

            // IMPORTANT: Ensure file exists check passes
            (fs.existsSync as jest.Mock).mockReturnValue(true);

            (ExtractionModel.findOne as jest.Mock).mockReturnValue({
                lean: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue(mockExtractions)
                })
            });

            const result = await getDocumentExtractions(documentId);

            expect(result).toHaveProperty('totalPages', 1); // Should use default of 1
        });
    });

    describe('deleteDocument', () => {
        test('should delete a document and its extractions', async () => {
            const mockDocument = createMockDocument({ _id: new Types.ObjectId() });

            if (!mockDocument._id) {
                throw new Error('Mock document _id is undefined');
            }

            const documentId = mockDocument._id.toString();

            (DocumentModel.findById as jest.Mock).mockReturnValue({
                lean: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue(mockDocument)
                })
            });

            await deleteDocument(documentId);

            expect(DocumentModel.findById).toHaveBeenCalledWith(documentId);
            expect(ExtractionModel.deleteOne).toHaveBeenCalledWith({ documentId: mockDocument._id });
            expect(DocumentModel.deleteOne).toHaveBeenCalledWith({ _id: mockDocument._id });
        });

        test('should throw an error when document does not exist', async () => {
            const documentId = new Types.ObjectId().toString();

            (DocumentModel.findById as jest.Mock).mockReturnValue({
                lean: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue(null)
                })
            });

            await expect(deleteDocument(documentId)).rejects.toThrow(
                new CustomError('Document not found', 404)
            );
        });
    });
}); 