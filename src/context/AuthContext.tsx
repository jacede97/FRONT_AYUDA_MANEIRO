import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import api from '../lib/axio.tsx';

interface AuthContextType {
  isLoggedIn: boolean;
  user: any;
  loadingAuth: boolean;
  login: (data: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    console.log('🔍 [Auth] Verificando sesión...');
    console.log('🔍 [Auth] access_token:', accessToken ? '✅' : '❌');

    if (accessToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsLoggedIn(true);
        console.log('✅ [Auth] Sesión restaurada para:', parsedUser.username);
      } catch (e) {
        console.error('❌ [Auth] Error parseando usuario:', e);
        logout();
      }
    } else {
      console.log('ℹ️ [Auth] No hay sesión activa');
    }
    setLoadingAuth(false);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const refreshToken = localStorage.getItem('refresh_token');

    if (isLoggedIn && refreshToken) {
      const refresh = async () => {
        try {
          console.log('🔄 [Auth] Refrescando token automáticamente...');
          const response = await api.post('/auth/refresh/', { refresh: refreshToken });
          localStorage.setItem('access_token', response.data.access);
          console.log('✅ [Auth] Token renovado');
        } catch (err) {
          console.error('❌ [Auth] Error renovando token:', err);
          logout();
        }
      };
      interval = setInterval(refresh, 23 * 60 * 60 * 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isLoggedIn]);

  const login = (userData: any) => {
    console.log('🔐 [Auth] Procesando login...');
    console.log('📦 [Auth] Datos recibidos:', userData);

    // ✅ Verifica que los campos existan
    if (!userData.access || !userData.refresh || !userData.user) {
      console.error('❌ [Auth] Faltan campos requeridos en la respuesta:', userData);
      return;
    }

    localStorage.setItem('access_token', userData.access);
    localStorage.setItem('refresh_token', userData.refresh);
    localStorage.setItem('user', JSON.stringify(userData.user));

    console.log('✅ [Auth] Tokens guardados en localStorage');
    console.log('🔑 [Auth] access_token:', userData.access.substring(0, 20) + '...');

    setUser(userData.user);
    setIsLoggedIn(true);
  };

  const logout = () => {
    console.log('🚪 [Auth] Cerrando sesión...');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsLoggedIn(false);
  };

  const value = { isLoggedIn, user, loadingAuth, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};