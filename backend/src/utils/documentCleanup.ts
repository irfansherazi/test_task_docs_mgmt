import fs from 'fs';
import path from 'path';
import DocumentModel from '../models/Document';

/**
 * Removes documents from the database that don't have corresponding files in the uploads folder
 * @returns The number of documents removed
 */
export const cleanupOrphanedDocuments = async (): Promise<number> => {
    try {
        // Get all documents from the database
        const documents = await DocumentModel.find().lean().exec();
        let removedCount = 0;

        // Check each document
        for (const document of documents) {
            const filePath = document.filePath;

            // Check if file exists
            if (!fs.existsSync(filePath)) {
                console.log(`File not found for document: ${document._id} (${document.fileName})`);

                // Delete the document from the database
                await DocumentModel.deleteOne({ _id: document._id });
                removedCount++;
            }
        }

        if (removedCount > 0) {
            console.log(`Removed ${removedCount} orphaned document(s) from database`);
        } else {
            console.log('No orphaned documents found');
        }

        return removedCount;
    } catch (error) {
        console.error('Error during document cleanup:', error);
        return 0;
    }
}; 