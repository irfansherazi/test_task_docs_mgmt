import { Router } from 'express';
import {
  uploadDocument,
  getExtractions,
  getDocumentMetadata,
  getDocuments,
  deleteDocument
} from '../controllers/documentController';
import { upload } from '../middleware/upload';
import {
  validateDocumentId,
  validateTotalPages,
  validateFileUpload,
  handleValidationErrors,
} from '../middleware/validation';

const router = Router();

// Get all documents
router.get('/', getDocuments);

// Upload document route with validation
router.post(
  '/upload',
  upload.single('file'),
  validateFileUpload,
  uploadDocument
);

// Get extractions route with validation
router.get(
  '/:id/extractions',
  validateDocumentId,
  handleValidationErrors,
  getExtractions
);

// Get metadata route with validation
router.get(
  '/:id',
  validateDocumentId,
  handleValidationErrors,
  getDocumentMetadata
);

// Delete document route with validation
router.delete(
  '/:id',
  validateDocumentId,
  handleValidationErrors,
  deleteDocument
);

export default router; 