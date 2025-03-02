import React from 'react';
import { Extraction } from '../types/document';
import '../styles/ExtractionsPanel.css';

interface ExtractionsPanelProps {
  extractions: Extraction[];
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  onPageChange: (pageNumber: number) => void;
  totalPages: number;
}

const ExtractionsPanel: React.FC<ExtractionsPanelProps> = ({
  extractions,
  isLoading,
  error,
  currentPage,
  onPageChange,
  totalPages
}) => {
  if (isLoading) {
    return (
      <div className="extractions-panel">
        <div className="loading">Loading extractions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="extractions-panel">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (extractions.length === 0) {
    return (
      <div className="extractions-panel">
        <div className="no-extractions">No extractions found</div>
      </div>
    );
  }

  // Group extractions by page
  const extractionsByPage = extractions.reduce((acc, extraction) => {
    const page = extraction.pageNumber;
    if (!acc[page]) {
      acc[page] = [];
    }
    acc[page].push(extraction);
    return acc;
  }, {} as Record<number, Extraction[]>);

  // Get unique page numbers and sort them
  const pages = Object.keys(extractionsByPage)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="extractions-panel">
      <h3>Extractions</h3>
      <div className="page-summary">
        Found extractions on {pages.length} of {totalPages} pages
      </div>
      <div className="extractions-list">
        {pages.map(pageNum => (
          <div key={pageNum} className="page-group">
            <div className="page-header">
              <h4>Page {pageNum}</h4>
              <div className="page-stats">
                {extractionsByPage[pageNum].length} extractions
              </div>
              <button
                className="go-to-page-button"
                onClick={() => onPageChange(pageNum)}
                disabled={currentPage === pageNum}
              >
                {currentPage === pageNum ? 'Current Page' : 'Go to Page'}
              </button>
            </div>
            {extractionsByPage[pageNum].map(extraction => (
              <div key={extraction.id} className="extraction-item">
                <div className="extraction-text">{extraction.text}</div>
                {extraction.confidence && (
                  <div className="extraction-confidence">
                    Confidence: {(extraction.confidence * 100).toFixed(1)}%
                  </div>
                )}
                {extraction.category && (
                  <div className="extraction-category">
                    Category: {extraction.category}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExtractionsPanel; 