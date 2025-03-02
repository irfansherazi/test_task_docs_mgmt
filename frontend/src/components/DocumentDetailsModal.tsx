import React, { useState, useEffect, useCallback } from 'react';
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

const DocumentDetailsModal: React.FC<DocumentDetailsModalProps> = React.memo(({
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
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && documentId) {
      fetchExtractions();
      fetchPdfFile();
    } else {
      setExtractions(null);
      setError(null);
      setPdfBlobUrl(null);
    }
  }, [isOpen, documentId]);

  const fetchExtractions = useCallback(async () => {
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
  }, [documentId]);

  const fetchPdfFile = useCallback(async () => {
    if (metadata) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/documents/${metadata.id}/file`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(blobUrl);
      } catch (error) {
        console.error('Error fetching PDF file:', error);
        setError('Failed to load PDF file');
      }
    }
  }, [metadata]);

  const handleDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  const goToPage = useCallback((pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= (numPages || 1)) {
      setCurrentPage(pageNumber);
    }
  }, [numPages]);

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="document-details-modal">
      <div className="modal-content">
        <div className="pdf-viewer">
          <Document
            file={pdfBlobUrl}
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
          totalPages={numPages || 0}
        />
      </div>
    </Modal>
  );
});

export default DocumentDetailsModal; 