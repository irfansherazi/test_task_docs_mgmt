import express from 'express';
import { upload } from '../middleware/upload';
import {
    validateDocumentId,
    validateTotalPages,
    validateFileUpload,
    handleValidationErrors,
} from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import {
    uploadDocument,
    getDocuments,
    getDocumentMetadata,
    getExtractions,
    deleteDocumentHandler,
    getDocumentFile
} from '../controllers/documentController';

/**
 * @swagger
 * components:
 *   schemas:
 *     DocumentMetadata:
 *       type: object
 *       required:
 *         - id
 *         - fileName
 *         - fileUrl
 *         - uploadDate
 *         - fileSize
 *         - pageCount
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier of the document
 *         fileName:
 *           type: string
 *           description: The name of the uploaded file
 *         fileUrl:
 *           type: string
 *           description: The URL where the file can be accessed
 *         uploadDate:
 *           type: string
 *           format: date-time
 *           description: The date and time when the document was uploaded
 *         fileSize:
 *           type: number
 *           description: The size of the file in bytes
 *         pageCount:
 *           type: number
 *           description: The number of pages in the document
 *     Extraction:
 *       type: object
 *       required:
 *         - id
 *         - text
 *         - pageNumber
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier of the extraction
 *         text:
 *           type: string
 *           description: The extracted text content
 *         pageNumber:
 *           type: number
 *           description: The page number where the text was extracted
 *         confidence:
 *           type: number
 *           description: The confidence score of the extraction (0-1)
 *         category:
 *           type: string
 *           description: The category of the extracted text
 *     DocumentExtractions:
 *       type: object
 *       required:
 *         - documentId
 *         - extractions
 *         - totalPages
 *       properties:
 *         documentId:
 *           type: string
 *           description: The ID of the document
 *         extractions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Extraction'
 *         totalPages:
 *           type: number
 *           description: Total number of pages in the document
 *     Error:
 *       type: object
 *       required:
 *         - message
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 */

const router = express.Router();

// Protect all document routes with authentication
router.use(authenticate);

/**
 * @swagger
 * /documents:
 *   get:
 *     tags:
 *       - Documents
 *     summary: Get all documents
 *     description: Retrieve a list of all documents metadata
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of documents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DocumentMetadata'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', getDocuments);

/**
 * @swagger
 * /documents:
 *   post:
 *     tags:
 *       - Documents
 *     summary: Upload a new document
 *     description: Upload a new PDF document to the system
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF file to upload (max 10MB)
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentMetadata'
 *       400:
 *         description: Invalid input (not a PDF or file too large)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', upload.single('file'), validateFileUpload, uploadDocument);

/**
 * @swagger
 * /documents/{id}/extractions:
 *   get:
 *     tags:
 *       - Documents
 *     summary: Get document extractions
 *     description: Retrieve all text extractions for a specific document
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document extractions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentExtractions'
 *       404:
 *         description: Document not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/extractions', validateDocumentId, handleValidationErrors, getExtractions);

/**
 * @swagger
 * /documents/{id}:
 *   get:
 *     tags:
 *       - Documents
 *     summary: Get document metadata
 *     description: Retrieve metadata for a specific document
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document metadata retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentMetadata'
 *       404:
 *         description: Document not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', validateDocumentId, handleValidationErrors, getDocumentMetadata);

/**
 * @swagger
 * /documents/{id}/file:
 *   get:
 *     tags:
 *       - Documents
 *     summary: Get document file
 *     description: Download the PDF file for a specific document
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Document not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/file', validateDocumentId, handleValidationErrors, getDocumentFile);

/**
 * @swagger
 * /documents/{id}:
 *   delete:
 *     tags:
 *       - Documents
 *     summary: Delete a document
 *     description: Delete a specific document and its associated data
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       204:
 *         description: Document deleted successfully
 *       404:
 *         description: Document not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', validateDocumentId, handleValidationErrors, deleteDocumentHandler);

export default router; 