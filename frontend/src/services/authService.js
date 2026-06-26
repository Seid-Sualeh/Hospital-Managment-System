import api, { setTenant, clearTenant, setStoredToken, clearStoredToken } from "./api";

const authService = {
  login: async (email, password, tenantId) => {
    if (tenantId) {
      setTenant(tenantId);
    }
    
    const response = await api.post("/auth/login", { email, password });
    
    const data = response.data;
    if (data?.accessToken) {
      setStoredToken(data.accessToken);
    }
    
    if (!tenantId && data?.user?.email) {
      const userTenant = await api
        .get("/tenants/lookup", {
          headers: {
            'X-Tenant-ID': getTenant(),
          },
        })
        .catch(() => null);
      
      if (userTenant?.data?.subdomain) {
        setTenant(userTenant.data.subdomain);
      }
    }
    
    return data;
  },

  logout: async () => {
    try {
      await api.post("/auth/logout", {}, { withCredentials: true });
    } catch (error) {
      console.warn("Logout API call failed:", error.message);
    } finally {
      clearStoredToken();
      clearTenant();
    }
    return { success: true };
  },

  getProfile: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  refreshToken: async () => {
    const response = await api.post("/auth/refresh", {}, { withCredentials: true });
    const data = response.data;
    if (data?.accessToken) {
      setStoredToken(data.accessToken);
    }
    return data;
  },

  forgotPassword: async (email, tenantId) => {
    const headers = {};
    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId;
    }
    const response = await api.post("/auth/forgot-password", { email }, { headers });
    return response.data;
  },

  resetPassword: async (token, password, tenantId) => {
    const headers = {};
    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId;
    }
    const response = await api.post("/auth/reset-password", { token, password }, { headers });
    return response.data;
  },

  lookupTenant: async (identifier) => {
    const response = await api.get(`/tenants/lookup?identifier=${encodeURIComponent(identifier)}`);
    return response.data;
  },
};

function getTenant() {
  try {
    return localStorage.getItem('tenant_id');
  } catch {
    return null;
  }
}

export default authService;