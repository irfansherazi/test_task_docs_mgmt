export interface DocumentMetadata {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadDate: string;
  fileSize: number;
  pageCount: number;
}

export interface Extraction {
  id: string;
  text: string;
  pageNumber: number;
  confidence?: number;
  category?: string;
}

export interface DocumentExtractions {
  documentId: string;
  extractions: Extraction[];
  totalPages: number;
}

export interface DocumentBoxProps {
  id: string;
  metadata: DocumentMetadata | null;
  onUpload: (file: File) => void;
  onView: () => void;
}

export interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => void;
}

export interface DocumentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  metadata: DocumentMetadata | null;
} 