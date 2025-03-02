import React, { useState } from 'react';
import { DocumentMetadata } from '../types/document';
import { TrashIcon } from '../utils/icons';
import UploadModal from './UploadModal';
import './DocumentBox.css';

interface DocumentBoxProps {
  metadata: DocumentMetadata | null;
  onUpload?: (file: File) => void;
  onView?: () => void;
  onDelete?: () => void;
}

const DocumentBox: React.FC<DocumentBoxProps> = ({ metadata, onUpload, onView, onDelete }) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const handleClick = () => {
    if (metadata && onView) {
      onView();
    } else if (!metadata && onUpload) {
      setIsUploadModalOpen(true);
    }
  };

  const handleUpload = (file: File) => {
    onUpload?.(file);
    setIsUploadModalOpen(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = () => {
    onDelete?.();
    setIsConfirmDeleteOpen(false);
  };

  return (
    <>
      <div className="document-box" onClick={handleClick}>
        <div className="document-content">
          {metadata ? (
            <>
              <h3>{metadata.fileName}</h3>
              <p>Uploaded: {new Date(metadata.uploadDate).toLocaleDateString()}</p>
              {onDelete && (
                <button
                  className="delete-button"
                  onClick={handleDelete}
                  title="Delete document"
                  aria-label={`Delete ${metadata.fileName}`}
                >
                  <TrashIcon />
                </button>
              )}
            </>
          ) : (
            <>
              <h3>Upload Document</h3>
              <p>Click to upload</p>
            </>
          )}
        </div>
      </div>
      {onUpload && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUpload={handleUpload}
        />
      )}
      {isConfirmDeleteOpen && (
        <div className="confirm-delete-modal">
          <div className="confirm-delete-content">
            <h3>Delete Document</h3>
            <p>Are you sure you want to delete {metadata?.fileName}?</p>
            <div className="confirm-delete-actions">
              <button onClick={() => setIsConfirmDeleteOpen(false)}>Cancel</button>
              <button onClick={confirmDelete} className="delete">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DocumentBox; 