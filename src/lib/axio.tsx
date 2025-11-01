import axios from 'axios';

const api = axios.create({
  baseURL: 'https://maneiro-api-mem1.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Agrega token a cada request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Maneja 401: intenta renovar token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Solo intenta renovar si es 401 y no es el login/refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/token/') &&
      !originalRequest.url.includes('/token/refresh/')
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const res = await axios.post(
          'https://maneiro-api-mem1.onrender.com/api/token/refresh/',
          { refresh: refreshToken }
        );

        const newAccessToken = res.data.access;
        localStorage.setItem('access_token', newAccessToken);

        // Reintenta la petición original con el nuevo token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        // Si falla el refresh → logout
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