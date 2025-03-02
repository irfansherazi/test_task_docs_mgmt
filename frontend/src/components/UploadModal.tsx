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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
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
        <button onClick={handleClose} className="close-button">×</button>
      </div>
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="file-input-container">
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="file-input"
          />
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
            Upload
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UploadModal; 