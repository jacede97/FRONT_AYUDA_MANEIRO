import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import api from '../lib/axio.tsx';

// Define la interfaz para el contexto de autenticación
interface AuthContextType {
  isLoggedIn: boolean;
  user: any;
  loadingAuth: boolean;
  login: (data: any) => void;
  logout: () => void;
}

// Crea el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define las props para el proveedor
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Efecto para verificar la sesión al cargar la página.
  // Se ejecuta una sola vez.
  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (accessToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsLoggedIn(true);
      } catch (e) {
        console.error("Error al parsear el usuario del localStorage", e);
        // Si hay un error, limpia todo y considera que no hay sesión
        logout();
      }
    }
    setLoadingAuth(false);
  }, []);

  // Efecto para manejar el refresco automático del token.
  // Solo se activa si el usuario está logueado.
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const refreshToken = localStorage.getItem('refresh_token');

    if (isLoggedIn && refreshToken) {
      // Función para renovar el token
      const refresh = async () => {
        try {
          console.log('Refrescando token...');
          const response = await api.post('/auth/refresh/', { refresh: refreshToken });
          localStorage.setItem('access_token', response.data.access);
          console.log('Token renovado exitosamente.');
        } catch (err) {
          console.error('Error al renovar token, cerrando sesión:', err);
          // Si el refresco falla (ej: token de refresco caducado), cierra la sesión
          logout();
        }
      };
      
      // Renueva el token cada 15 minutos (900000 ms). Esto es mucho más seguro y eficiente.
      interval = setInterval(refresh, 15 * 60 * 1000); 
    }

    // Función de limpieza para evitar que el intervalo se siga ejecutando
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLoggedIn]);

  const login = (userData: any) => {
    console.log("Datos de usuario recibidos para login:", userData);
    localStorage.setItem('access_token', userData.access);
    localStorage.setItem('refresh_token', userData.refresh);
    localStorage.setItem('user', JSON.stringify(userData.user));
    setUser(userData.user);
    setIsLoggedIn(true);
  };

  const logout = () => {
    console.log("Cerrando sesión...");
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

// Hook para consumir el contexto fácilmente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
