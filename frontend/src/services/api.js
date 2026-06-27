import axios from "axios";

const TENANT_KEY = 'tenant_id';
const TOKEN_KEY = 'token';
const USER_KEY = 'user';

const getSubdomain = () => {
  const host = window.location.host;
  const hostname = host.split(":")[0].toLowerCase().trim();

  // Treat localhost and loopback IPs as no tenant subdomain
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    /^127\.[0-9]+\.[0-9]+\.[0-9]+$/.test(hostname)
  ) {
    return "";
  }

  const parts = hostname.split(".");
  if (parts.length >= 2) {
    return parts[0].toLowerCase().trim();
  }
  return "";
};

const getBaseURL = () => {
  return import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
};

const getTenant = () => {
  try {
    const stored = localStorage.getItem(TENANT_KEY);
    if (stored) {
      return stored.toLowerCase().trim();
    }
  } catch (e) {
    console.warn('[API] Failed to read tenant from localStorage:', e);
  }
  return null;
};

const setTenant = (subdomain) => {
  try {
    localStorage.setItem(TENANT_KEY, subdomain.toLowerCase().trim());
  } catch (e) {
    console.warn('[API] Failed to persist tenant to localStorage:', e);
  }
};

const clearTenant = () => {
  try {
    localStorage.removeItem(TENANT_KEY);
  } catch (e) {
    console.warn('[API] Failed to clear tenant from localStorage:', e);
  }
};

const getStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    return null;
  }
};

const setStoredToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.warn('[API] Failed to persist token to localStorage:', e);
  }
};

const clearStoredToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (e) {
    console.warn('[API] Failed to clear auth from localStorage:', e);
  }
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const tenant = getTenant();
    if (tenant) {
      config.headers['X-Tenant-ID'] = tenant;
    } else {
      // Fallback to subdomain-based tenant detection
      const subdomain = getSubdomain();
      if (subdomain && subdomain !== "www") {
        config.headers["X-Tenant-ID"] = subdomain;
      }
    }

    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

const handleApiError = (error) => {
  const message =
    error.response?.data?.error?.message ||
    error.response?.data?.message ||
    error.message ||
    "Request failed";
  const code = error.response?.data?.error?.code;
  return { message, code, status: error.response?.status };
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      error.response?.data?.error?.code === "TOKEN_EXPIRED" &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axios.post(
          `${getBaseURL()}/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: {
              'X-Tenant-ID': getTenant() || getSubdomain() || "yared",
            },
          }
        );

        if (refreshResponse.data?.accessToken) {
          setStoredToken(refreshResponse.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
          return api(originalRequest);
        }
      } catch {
        clearStoredToken();
        clearTenant();
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }

    if (error.response?.status === 401 && !originalRequest?.url?.includes('/auth/login')) {
      const stored = getStoredToken();
      if (!stored && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    error.apiError = handleApiError(error);
    return Promise.reject(error);
  },
);

export { handleApiError, getBaseURL, getTenant, setTenant, clearTenant, getStoredToken, setStoredToken, clearStoredToken };
export default api;