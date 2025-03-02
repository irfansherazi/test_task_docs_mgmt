import axios from 'axios';
import { DocumentMetadata, DocumentExtractions } from '../types/document';

export const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error('VITE_API_URL is not defined in the environment variables');
}

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on 401 from login endpoint
    if (error.response?.status === 401 && !error.config.url?.includes('/auth/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const login = async (email: string, password: string) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.response?.status === 401) {
      throw new Error('Invalid email or password');
    } else if (error.response?.status === 400) {
      throw new Error('Please check your input and try again');
    } else if (!error.response) {
      throw new Error('Network error. Please check your connection');
    } else {
      throw new Error('Login failed. Please try again');
    }
  }
};

// Document endpoints
export const uploadDocument = async (file: File): Promise<DocumentMetadata> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post('/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Upload failed');
  }
};

export const getDocuments = async (): Promise<DocumentMetadata[]> => {
  try {
    const response = await api.get('/documents');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch documents');
  }
};

export const getDocumentMetadata = async (id: string): Promise<DocumentMetadata> => {
  try {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch document metadata');
  }
};

export const getDocumentExtractions = async (id: string): Promise<DocumentExtractions> => {
  try {
    const response = await api.get(`/documents/${id}/extractions`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to fetch extractions');
  }
};

export const deleteDocument = async (id: string): Promise<void> => {
  try {
    await api.delete(`/documents/${id}`);
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to delete document');
  }
}; 