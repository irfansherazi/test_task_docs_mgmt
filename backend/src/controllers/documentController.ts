import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import {
  createDocument,
  getAllDocuments,
  getDocumentExtractions,
  getDocumentMetadata as getDocumentMetadataService,
  deleteDocument
} from '../services/documentService';
import { CustomError } from '../utils/errors';

export const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new CustomError('No file uploaded', 400);
    }
    const metadata = await createDocument(req.file);
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
    const metadata = await getDocumentMetadataService(documentId);
    res.status(200).json(metadata);
  } catch (error) {
    next(error);
  }
};

export const deleteDocumentHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documentId = req.params.id;
    await deleteDocument(documentId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getDocumentFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documentId = req.params.id;
    const metadata = await getDocumentMetadataService(documentId);

    if (!metadata.filePath) {
      throw new CustomError('File path not found', 404);
    }

    // Get the absolute path to the uploads directory
    const uploadsDir = path.join(__dirname, '../../uploads');

    // Get just the filename from the stored path
    const filename = path.basename(metadata.filePath);

    // Construct the absolute path to the file
    const absolutePath = path.join(uploadsDir, filename);

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      throw new CustomError('File not found on disk', 404);
    }

    // Set content type header
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${metadata.fileName}"`);

    // Send the file
    res.sendFile(absolutePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        next(new CustomError('Error sending file', 500));
      }
    });
  } catch (error) {
    next(error);
  }
}; 