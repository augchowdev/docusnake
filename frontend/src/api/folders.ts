import apiClient from './client';
import { Folder, CreateFolderRequest, UpdateFolderRequest } from '../types';

export const getFolders = async (): Promise<Folder[]> => {
  const response = await apiClient.get<Folder[]>('/api/folders');
  return response.data;
};

export const getFolder = async (id: string): Promise<Folder> => {
  const response = await apiClient.get<Folder>(`/api/folders/${id}`);
  return response.data;
};

export const createFolder = async (data: CreateFolderRequest): Promise<Folder> => {
  const response = await apiClient.post<Folder>('/api/folders', data);
  return response.data;
};

export const updateFolder = async (
  id: string,
  data: UpdateFolderRequest,
): Promise<Folder> => {
  const response = await apiClient.put<Folder>(`/api/folders/${id}`, data);
  return response.data;
};

export const deleteFolder = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/folders/${id}`);
};
