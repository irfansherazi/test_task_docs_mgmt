export interface DocumentMetadata {
  id: string;
  fileName: string;
  uploadDate: string;
  hasFile: boolean;
  fileUrl?: string;
}

export interface Extraction {
  id: string;
  text: string;
  pageNumber: number;
}

export interface DocumentExtractions {
  documentId: string;
  extractions: Extraction[];
} 