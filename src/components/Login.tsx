// src/components/Login.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Para redirección
import api from '../lib/axio.tsx'; // Importa tu instancia de axios

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState(localStorage.getItem('remembered_username') || '');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('remember_me'));
  const navigate = useNavigate();

  // Restaurar sesión si "remember_me" está activo
  useEffect(() => {
    const remembered = localStorage.getItem('remember_me');
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    if (remembered && accessToken && refreshToken) {
      onLoginSuccess();
      navigate('/dashboard');
    }
  }, [onLoginSuccess, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login/', {
        username: username.trim(),
        password: password,
      });
      // Guarda los tokens y datos del usuario
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Si "Recordar contraseña" está marcado, guarda el indicador y el username (NO la contraseña)
      if (rememberMe) {
        localStorage.setItem('remember_me', 'true');
        localStorage.setItem('remembered_username', username.trim());
      } else {
        localStorage.removeItem('remember_me');
        localStorage.removeItem('remembered_username');
      }

      onLoginSuccess();
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.detail) {
        setLoginError(err.response.data.detail);
      } else {
        setLoginError('Usuario o contraseña incorrecta');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#0095D4] to-[#003578] flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-blue-100">
        <div className="text-center mb-6">
          <img
            src="/LOGO.png"
            alt="Logo de la Aplicación"
            className="h-20 w-auto mx-auto block mb-3"
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/80x80/cccccc/ffffff?text=LOGO';
              e.currentTarget.onerror = null;
            }}
          />
          <h1 className="text-2xl font-extrabold text-gray-800">Gestión de Ayudas</h1>
        </div>
        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
            <input
              type="text"
              name="username"  // Añadido para autocompletado del navegador
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all"
              placeholder="Ej: USUARIO"
              required
              autoFocus
              autoComplete="username"  // Para autocompletado
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <input
              type="password"
              name="password"  // Añadido para autocompletado del navegador
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:border-[#0069B6] transition-all"
              placeholder="Ingrese su contraseña"
              required
              autoComplete="current-password"  // Para autocompletado
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mr-2 h-4 w-4 text-[#0069B6] focus:ring-[#0095D4] border-gray-300 rounded"
              />
              Recordar usuario
            </label>
          </div>
          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {loginError}
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-[#0069B6] text-white py-2 px-4 rounded-xl hover:bg-[#003578] focus:ring-4 focus:ring-[#0095D4] transition-all font-medium transform hover:scale-105 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Iniciando' : 'Iniciar Sesión'}
          </button>
        </form>
        <div className="text-center mt-4 text-sm text-gray-500">
          <p>Usa tu nombre de usuario y contraseña de administrador</p>
        </div>
      </div>
    </div>
  );
};

export default Login;