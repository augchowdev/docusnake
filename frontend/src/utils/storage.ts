import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

const TOKEN_KEY = '@docusnake_token';
const USER_KEY = '@docusnake_user';

export const saveToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const getToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(TOKEN_KEY);
};

export const removeToken = async (): Promise<void> => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};

export const saveUser = async (user: User): Promise<void> => {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = async (): Promise<User | null> => {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

export const removeUser = async (): Promise<void> => {
  await AsyncStorage.removeItem(USER_KEY);
};

export const clearAuth = async (): Promise<void> => {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
};
