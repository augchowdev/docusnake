import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { login as apiLogin, register as apiRegister } from '../api/auth';
import { saveToken, saveUser, clearAuth, getUser } from '../utils/storage';
import { User, LoginRequest, RegisterRequest } from '../types';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        const stored = await getUser();
        if (stored) setUser(stored);
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await apiLogin(data);
    const userData: User = {
      userId: response.UserId,
      username: response.Username,
      email: response.Email,
      token: response.Token,
    };
    await saveToken(response.Token);
    await saveUser(userData);
    setUser(userData);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const response = await apiRegister(data);
    const userData: User = {
      userId: response.UserId,
      username: response.Username,
      email: response.Email,
      token: response.Token,
    };
    await saveToken(response.Token);
    await saveUser(userData);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    await clearAuth();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
