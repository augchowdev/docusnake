import apiClient from './client';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types';

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/api/auth/login', data);
  return response.data;
};

export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/api/auth/register', data);
  return response.data;
};
