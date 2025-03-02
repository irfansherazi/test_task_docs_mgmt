import React, { useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import Modal from './Modal';
import ExtractionsPanel from './ExtractionsPanel';
import { API_BASE_URL } from '../services/api';
import { DocumentMetadata, DocumentExtractions } from '../types/document';
import { getDocumentExtractions } from '../services/api';
import '../styles/DocumentDetailsModal.css';

interface DocumentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  metadata: DocumentMetadata | null;
}

const DocumentDetailsModal: React.FC<DocumentDetailsModalProps> = ({
  isOpen,
  onClose,
  documentId,
  metadata
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [extractions, setExtractions] = useState<DocumentExtractions | null>(null);
  const [isLoadingExtractions, setIsLoadingExtractions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && documentId) {
      fetchExtractions();
    } else {
      setExtractions(null);
      setError(null);
    }
  }, [isOpen, documentId]);

  const fetchExtractions = async () => {
    try {
      setIsLoadingExtractions(true);
      setError(null);
      const data = await getDocumentExtractions(documentId);
      setExtractions(data);
    } catch (error) {
      console.error('Error fetching extractions:', error);
      setError('Failed to load extractions');
    } finally {
      setIsLoadingExtractions(false);
    }
  };

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const goToPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= (numPages || 1)) {
      setCurrentPage(pageNumber);
    }
  };

  // Get the authentication token
  const token = localStorage.getItem('token');

  // Construct the full URL to the PDF file
  const fileUrl = metadata ? `${API_BASE_URL}/documents/${metadata.id}/file` : null;

  // Configure options for the PDF request
  const options = {
    httpHeaders: {
      'Authorization': `Bearer ${token}`
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="document-details-modal">
      <div className="modal-content">
        <div className="pdf-viewer">
          <Document
            file={fileUrl ? { url: fileUrl, ...options } : null}
            onLoadSuccess={handleDocumentLoadSuccess}
            loading={<div className="loading">Loading PDF...</div>}
            error={<div className="error">Failed to load PDF</div>}
          >
            <Page
              pageNumber={currentPage}
              loading={<div className="loading">Loading page...</div>}
              error={<div className="error">Failed to load page</div>}
            />
          </Document>
          {numPages && numPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {numPages}
              </span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= numPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
        <ExtractionsPanel
          extractions={extractions?.extractions || []}
          isLoading={isLoadingExtractions}
          error={error}
          currentPage={currentPage}
          onPageChange={goToPage}
          totalPages={extractions?.totalPages || 0}
        />
      </div>
    </Modal>
  );
};

export default DocumentDetailsModal; 