import { Types } from 'mongoose';
import path from 'path';
import { CustomError } from '../utils/errors';
import DocumentModel, { DocumentWithTimestamps } from '../models/Document';
import ExtractionModel from '../models/Extraction';
import { DocumentMetadata, DocumentExtractions } from '../types/document';
import { generateMockExtractions } from '../utils/mockData';

const documentToMetadata = (doc: DocumentWithTimestamps): DocumentMetadata => ({
  id: doc._id.toString(),
  fileName: doc.fileName,
  fileUrl: `/uploads/${path.basename(doc.filePath)}`,
  uploadDate: doc.createdAt.toISOString(),
  fileSize: doc.metadata.size,
  pageCount: doc.metadata.pageCount || 0,
  filePath: doc.filePath
});

export const getAllDocuments = async (): Promise<DocumentMetadata[]> => {
  const documents = await DocumentModel.find().lean<DocumentWithTimestamps[]>().exec();
  return documents.map(documentToMetadata);
};

export const createDocument = async (file: Express.Multer.File): Promise<DocumentMetadata> => {
  if (!file) {
    throw new CustomError('No file uploaded', 400);
  }

  if (file.mimetype !== 'application/pdf') {
    throw new CustomError('Only PDF files are allowed', 400);
  }

  const document = await DocumentModel.create({
    title: file.originalname,
    description: 'Uploaded document',
    fileName: file.originalname,
    filePath: file.path,
    fileType: file.mimetype,
    metadata: {
      size: file.size,
      uploadedBy: 'system',
      version: 1,
      pageCount: 0
    }
  });

  // Create mock extractions for the document
  const mockData = generateMockExtractions(document._id.toString());
  await ExtractionModel.create({
    documentId: document._id,
    extractions: mockData.extractions
  });

  return documentToMetadata(document);
};

export const getDocumentMetadata = async (id: string): Promise<DocumentMetadata> => {
  const document = await DocumentModel.findById(id).lean<DocumentWithTimestamps>().exec();
  if (!document) {
    throw new CustomError('Document not found', 404);
  }
  return documentToMetadata(document);
};

export const getDocumentExtractions = async (documentId: string): Promise<DocumentExtractions> => {
  const document = await DocumentModel.findById(documentId).lean<DocumentWithTimestamps>().exec();
  if (!document) {
    throw new CustomError('Document not found', 404);
  }

  const extraction = await ExtractionModel.findOne({ documentId: document._id }).lean().exec();
  if (!extraction) {
    throw new CustomError('No extractions found for this document', 404);
  }

  // Return all extractions sorted by page number
  return {
    documentId,
    extractions: extraction.extractions.sort((a, b) => a.pageNumber - b.pageNumber),
    totalPages: document.metadata.pageCount || 1
  };
};

export const deleteDocument = async (documentId: string): Promise<void> => {
  const document = await DocumentModel.findById(documentId).lean<DocumentWithTimestamps>().exec();
  if (!document) {
    throw new CustomError('Document not found', 404);
  }

  // Delete associated extractions
  await ExtractionModel.deleteOne({ documentId: document._id }).exec();

  // Delete the document
  await DocumentModel.deleteOne({ _id: document._id }).exec();
}; 