import apiClient from './client';
import { Document, CreateDocumentRequest, UpdateDocumentRequest } from '../types';

export const getDocuments = async (folderId?: string): Promise<Document[]> => {
  const params = folderId ? { folderId } : {};
  const response = await apiClient.get<Document[]>('/api/documents', { params });
  return response.data;
};

export const getDocument = async (id: string): Promise<Document> => {
  const response = await apiClient.get<Document>(`/api/documents/${id}`);
  return response.data;
};

export const createDocument = async (data: CreateDocumentRequest): Promise<Document> => {
  const response = await apiClient.post<Document>('/api/documents', data);
  return response.data;
};

export const updateDocument = async (
  id: string,
  data: UpdateDocumentRequest,
): Promise<Document> => {
  const response = await apiClient.put<Document>(`/api/documents/${id}`, data);
  return response.data;
};

export const deleteDocument = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/documents/${id}`);
};

export const extractDocument = async (id: string): Promise<Document> => {
  const response = await apiClient.post<Document>(`/api/documents/${id}/extract`);
  return response.data;
};
