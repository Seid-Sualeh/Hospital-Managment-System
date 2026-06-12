import axios from 'axios';

const getSubdomain = () => {
  const host = window.location.host;
  const parts = host.split('.');
  if (parts.length >= 2) {
    return parts[0].toLowerCase().trim();
  }
  return '';
};

const getBaseURL = () => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const subdomain = getSubdomain();
    if (subdomain && subdomain !== 'www' && subdomain !== 'localhost') {
      config.headers['X-Tenant-ID'] = subdomain;
    } else {
      config.headers['X-Tenant-ID'] = 'yared';
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

const handleApiError = (error) => {
  const message =
    error.response?.data?.error?.message ||
    error.response?.data?.message ||
    error.message ||
    'Request failed';
  const code = error.response?.data?.error?.code;
  return { message, code, status: error.response?.status };
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.error?.code === 'TOKEN_EXPIRED' &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axios.post(
          `${getBaseURL()}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        if (refreshResponse.data?.accessToken) {
          const newToken = refreshResponse.data.accessToken;
          localStorage.setItem('token', newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }

    if (error.response?.status === 401 && !originalRequest?.url?.includes('/auth/login')) {
      const stored = localStorage.getItem('token');
      if (!stored && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    error.apiError = handleApiError(error);
    return Promise.reject(error);
  }
);

export { handleApiError, getBaseURL };
export default api;
