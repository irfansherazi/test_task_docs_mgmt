import React from 'react';
import { Document, Page } from 'react-pdf';

interface PDFViewerProps {
  fileUrl: string;
  currentPage: number;
  numPages: number | null;
  onPageChange: (pageNumber: number) => void;
  onLoadSuccess: ({ numPages }: { numPages: number }) => void;
  onLoadError: (error: Error) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  fileUrl,
  currentPage,
  numPages,
  onPageChange,
  onLoadSuccess,
  onLoadError,
}) => {
  return (
    <div className="pdf-preview">
      <div className="pdf-content">
        <Document
          file={fileUrl}
          onLoadSuccess={onLoadSuccess}
          onLoadError={onLoadError}
          loading={<div className="loading">Loading PDF...</div>}
          error={
            <div className="error">Failed to load PDF.</div>
          }
        >
          {numPages !== null && numPages > 0 && (
            <div style={{ width: '100%' }}>
              <Page 
                pageNumber={currentPage} 
                scale={1.0}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                width={800}
              />
            </div>
          )}
        </Document>
      </div>
      {numPages !== null && numPages > 0 && (
        <div className="pdf-navigation">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
          >
            Previous
          </button>
          <span>Page {currentPage} of {numPages}</span>
          <button
            onClick={() => onPageChange(Math.min(numPages, currentPage + 1))}
            disabled={currentPage >= numPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PDFViewer; 