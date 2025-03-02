import express from 'express';
import { upload } from '../middleware/upload';
import { validateDocumentId } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import {
    uploadDocument,
    getDocuments,
    getDocumentMetadata,
    getExtractions,
    deleteDocument
} from '../controllers/documentController';

const router = express.Router();

// Protect all document routes with authentication
router.use(authenticate);

// Document routes
router.post('/', upload.single('file'), uploadDocument);
router.get('/', getDocuments);
router.get('/:id', validateDocumentId, getDocumentMetadata);
router.get('/:id/extractions', validateDocumentId, getExtractions);
router.delete('/:id', validateDocumentId, deleteDocument);

export default router; 