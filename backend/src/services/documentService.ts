import { DocumentMetadata } from '../types/document';
import { generateMockExtractions } from '../utils/mockData';
import { CustomError } from '../utils/errors';
import DocumentModel, { IDocument } from '../models/Document';
import ExtractionModel from '../models/Extraction';
import { Types } from 'mongoose';

interface DocumentWithId extends IDocument {
  _id: Types.ObjectId;
}

const documentToMetadata = (document: DocumentWithId): DocumentMetadata => ({
  id: document._id.toString(),
  fileName: document.fileName,
  uploadDate: document.uploadDate.toISOString(),
  hasFile: !!document.filePath,
  fileUrl: document.filePath || undefined
});

export const getAllDocuments = async (): Promise<DocumentMetadata[]> => {
  const documents = await DocumentModel.find().exec();
  return documents.map(doc => documentToMetadata(doc as DocumentWithId));
};

export const createDocument = async (
  file: Express.Multer.File
): Promise<DocumentMetadata> => {
  if (!file) {
    throw new CustomError('No file uploaded', 400);
  }

  if (file.mimetype !== 'application/pdf') {
    throw new CustomError('Only PDF files are allowed', 400);
  }

  const document = new DocumentModel({
    title: file.originalname,
    description: `Uploaded document`,
    fileName: file.originalname,
    filePath: `/uploads/${file.filename}`,
    fileType: file.mimetype,
    metadata: {
      size: file.size,
      uploadedBy: 'system',
      version: 1
    }
  }) as DocumentWithId;

  await document.save();

  // Create mock extractions for the document
  const mockData = generateMockExtractions(document._id.toString());
  const extraction = new ExtractionModel({
    documentId: document._id,
    extractions: mockData.extractions
  });

  await extraction.save();

  return documentToMetadata(document);
};

export const getDocumentMetadata = async (documentId: string): Promise<DocumentMetadata> => {
  const document = await DocumentModel.findById(documentId).exec();
  if (!document) {
    throw new CustomError('Document not found', 404);
  }

  return documentToMetadata(document as DocumentWithId);
};

export const getOrCreateDefaultMetadata = async (documentId: string): Promise<DocumentMetadata> => {
  let document = await DocumentModel.findById(documentId).exec();

  if (!document) {
    document = new DocumentModel({
      _id: new Types.ObjectId(documentId),
      title: `Document ${documentId}`,
      description: 'Default document',
      fileName: `Document ${documentId}`,
      filePath: '',
      fileType: 'application/pdf',
      metadata: {
        size: 0,
        uploadedBy: 'system',
        version: 1
      }
    });
    await document.save();
  }

  return documentToMetadata(document as DocumentWithId);
};

export const getDocumentExtractions = async (documentId: string) => {
  const document = await DocumentModel.findById(documentId).exec();
  if (!document) {
    throw new CustomError('Document not found', 404);
  }

  const extraction = await ExtractionModel.findOne({ documentId: document._id }).exec();
  if (!extraction) {
    throw new CustomError('No extractions found for this document', 404);
  }

  // Return all extractions sorted by page number
  return {
    documentId,
    extractions: extraction.extractions.sort((a, b) => a.pageNumber - b.pageNumber)
  };
};

export const deleteDocument = async (documentId: string): Promise<void> => {
  const document = await DocumentModel.findById(documentId).exec();
  if (!document) {
    throw new CustomError('Document not found', 404);
  }

  // Delete associated extractions
  await ExtractionModel.deleteOne({ documentId: document._id }).exec();

  // Delete the document
  await DocumentModel.deleteOne({ _id: document._id }).exec();
}; 