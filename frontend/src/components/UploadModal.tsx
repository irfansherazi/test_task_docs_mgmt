import React, { useState, useRef } from 'react';
import Modal from 'react-modal';
import './UploadModal.css';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
}

const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUpload
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    handleFile(file);
  };

  const handleFile = (file: File | undefined | null) => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setSelectedFile(file);
    setError('');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }
    onUpload(selectedFile);
    handleClose();
  };

  const handleClose = () => {
    setSelectedFile(null);
    setError('');
    setIsDragging(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      className="upload-modal"
      overlayClassName="upload-modal-overlay"
    >
      <div className="modal-header">
        <h2>Upload Legal Document</h2>
        <button onClick={handleClose} className="close-button" aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <form onSubmit={handleSubmit} className="upload-form">
        <div
          className={`file-drop-zone ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="file-input"
          />
          <div className="upload-icon" onClick={() => fileInputRef.current?.click()}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" strokeLinecap="round" />
              <path d="M17 8l-5-5-5 5" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 3v12" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="upload-text">
            {selectedFile ? (
              <p className="selected-file">{selectedFile.name}</p>
            ) : (
              <>
                <p className="primary-text">Drag & drop your PDF here</p>
                <p className="secondary-text">or click to browse</p>
              </>
            )}
          </div>
          <p className="file-requirements">Accepted format: PDF only</p>
          {error && <p className="error-message">{error}</p>}
        </div>
        <div className="modal-actions">
          <button type="button" onClick={handleClose} className="cancel-button">
            Cancel
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={!selectedFile || !!error}
          >
            Upload Document
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UploadModal; 