import { Request, Response, NextFunction } from 'express';
import {
  createDocument,
  getDocumentMetadata as getDocumentMetadataFromService,
  getDocumentExtractions,
  getAllDocuments,
  deleteDocument as deleteDocumentService
} from '../services/documentService';
import { CustomError } from '../utils/errors';
import { DocumentMetadata } from '../types/document';

interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}

export const uploadDocument = async (req: RequestWithFile, res: Response, next: NextFunction) => {
  try {
    const metadata = await createDocument(req.file!);
    res.status(201).json(metadata);
  } catch (error) {
    next(error);
  }
};

export const getDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documents = await getAllDocuments();
    res.status(200).json(documents);
  } catch (error) {
    next(error);
  }
};

export const getExtractions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documentId = req.params.id;
    const result = await getDocumentExtractions(documentId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getDocumentMetadata = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documentId = req.params.id;
    const metadata = await getDocumentMetadataFromService(documentId);
    res.status(200).json(metadata);
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documentId = req.params.id;
    await deleteDocumentService(documentId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}; 