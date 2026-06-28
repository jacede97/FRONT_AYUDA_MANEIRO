import axios from 'axios';

const api = axios.create({
  baseURL: 'https://maneiro-api-mem1.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Interceptor para agregar token a cada petición
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    console.log('🔑 [Interceptor] Token:', token ? '✅ Presente' : '❌ Ausente');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Interceptor para manejar 401 y refrescar token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ❗ Solo intenta refrescar si:
    // - es 401
    // - no se ha reintentado ya
    // - la URL NO es de login ni de refresh (para evitar bucles)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login/') &&
      !originalRequest.url.includes('/auth/refresh/')
    ) {
      originalRequest._retry = true;
      console.warn('🔄 [Interceptor] 401 detectado, refrescando token...');

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          console.error('❌ [Interceptor] No hay refresh token');
          throw new Error('No refresh token');
        }

        // ✅ Usa la misma ruta que en AuthContext
        const res = await axios.post(
          'https://maneiro-api-mem1.onrender.com/api/auth/refresh/',
          { refresh: refreshToken }
        );

        const newAccessToken = res.data.access;
        localStorage.setItem('access_token', newAccessToken);
        console.log('✅ [Interceptor] Token refrescado exitosamente');

        // Reintenta la petición original con el nuevo token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        console.error('❌ [Interceptor] Falló el refresh:', refreshError);
        // Si falla, borra todo y redirige al login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;