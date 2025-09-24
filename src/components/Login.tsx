import React, { useState, useRef, useEffect } from 'react';
import Granim from 'granim';
import api from '../lib/axio.tsx';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { login } = useAuth();

  useEffect(() => {
    if (canvasRef.current) {
      try {
        const granimInstance = new Granim({
          element: canvasRef.current,
          direction: 'left-right',
          isPausedWhenNotInView: true,
          states: {
            'default-state': {
              gradients: [
                [{ color: '#E3F2FD', pos: 0 }, { color: '#64B5F6', pos: 1 }],
                [{ color: '#0D47A1', pos: 0 }, { color: '#1E88E5', pos: 1 }],
              ],
              transitionSpeed: 2000,
            },
          },
        });
        return () => granimInstance.destroy();
      } catch (error) {
        console.error('Error inicializando Granim:', error);
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login/', {
        username: username.trim(),
        password: password,
      });
      login(response.data);
    } catch (err: any) {
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
    <div className="h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" />

      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-blue-100 relative z-10">
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
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:border-[#0069B6]"
              placeholder="Ej: USUARIO"
              required
              autoFocus
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:border-[#0069B6]"
              placeholder="Ingrese su contraseña"
              required
              autoComplete="current-password"
            />
          </div>
          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {loginError}
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-[#0069B6] text-white py-2 px-4 rounded-xl hover:bg-[#003578] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Iniciando...
              </>
            ) : (
              'Iniciar Sesión'
            )}
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
