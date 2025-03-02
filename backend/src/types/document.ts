export interface DocumentMetadata {
  id: string;
  fileName: string;
  fileUrl: string;
  uploadDate: string;
  fileSize: number;
  pageCount: number;
  filePath: string;
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