import api from "./api";

const authService = {
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  logout: async () => {
    try {
      const response = await api.post(
        "/auth/logout",
        {},
        { withCredentials: true },
      );
      return response.data;
    } catch (error) {
      // Logout succeeds even if the backend call fails (frontend clears token)
      console.warn(
        "Logout API call failed, but proceeding with local logout:",
        error.message,
      );
      return { success: true };
    }
  },

  getProfile: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  refreshToken: async () => {
    const response = await api.post(
      "/auth/refresh",
      {},
      { withCredentials: true },
    );
    return response.data;
  },
};

export default authService;
