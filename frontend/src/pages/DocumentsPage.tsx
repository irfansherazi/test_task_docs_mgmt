import React, { useState, useEffect } from 'react';
import { pdfjs } from 'react-pdf';
import DocumentBox from '../components/DocumentBox';
import DocumentDetailsModal from '../components/DocumentDetailsModal';
import Logo from '../components/Logo';
import { DocumentMetadata } from '../types/document';
import { uploadDocument, getDocuments, deleteDocument } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/DocumentsPage.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

const DocumentsPage: React.FC = () => {
    const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
    const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, logout } = useAuth();

    const fetchDocuments = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const docs = await getDocuments();
            setDocuments(docs);
        } catch (error) {
            console.error('Error fetching documents:', error);
            setError('Failed to load documents. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleUpload = async (file: File) => {
        try {
            await uploadDocument(file);
            await fetchDocuments(); // Refresh the documents list after upload
        } catch (error) {
            console.error('Error uploading document:', error);
            alert('Failed to upload document. Please try again.');
        }
    };

    const handleView = (id: string) => {
        setSelectedDocument(id);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedDocument(null);
    };

    const handleDelete = async (documentId: string) => {
        try {
            await deleteDocument(documentId);
            await fetchDocuments(); // Refresh the list after deletion
        } catch (error) {
            console.error('Error deleting document:', error);
            alert('Failed to delete document. Please try again.');
        }
    };

    return (
        <div className="documents-page">
            <header className="documents-header">
                <div className="header-left">
                    <Logo />
                </div>
                <div className="header-right">
                    <span className="user-info">Welcome, {user?.name}</span>
                    <button onClick={logout} className="logout-button">
                        Logout
                    </button>
                </div>
            </header>
            <main className="document-grid">
                {error && <div className="error-message">{error}</div>}
                {isLoading ? (
                    <div className="loading-message">Loading documents...</div>
                ) : (
                    <>
                        {/* Empty upload box */}
                        <DocumentBox
                            key="upload"
                            metadata={null}
                            onUpload={handleUpload}
                        />
                        {/* Uploaded documents */}
                        {documents.map(doc => (
                            <DocumentBox
                                key={doc.id}
                                metadata={doc}
                                onView={() => handleView(doc.id)}
                                onDelete={() => handleDelete(doc.id)}
                            />
                        ))}
                    </>
                )}
            </main>
            {selectedDocument && (
                <DocumentDetailsModal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    documentId={selectedDocument}
                    metadata={documents.find(doc => doc.id === selectedDocument) || null}
                />
            )}
        </div>
    );
};

export default DocumentsPage; 