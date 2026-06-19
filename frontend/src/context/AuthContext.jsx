import React, { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const restoreSession = async () => {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");

      if (!storedUser || !storedToken) {
        setLoading(false);
        return;
      }

      try {
        const profile = await authService.getProfile();
        const userData = profile?.user || profile?.data?.user;
        if (userData) {
          localStorage.setItem("user", JSON.stringify(userData));
          setUser(userData);
        } else {
          setUser(JSON.parse(storedUser));
        }
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const data = await authService.login(email, password);

      if (data?.success) {
        const accessToken = data.accessToken || data.data?.accessToken;
        const userData = data.user || data.data?.user;

        localStorage.setItem("token", accessToken);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        return userData;
      }
      throw new Error(data?.error?.message || "Login failed.");
    } catch (err) {
      const errMsg =
        err.apiError?.message ||
        err.response?.data?.error?.message ||
        err.message;
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn("API logout warning:", err.message);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    }
  };

  /**
   * Get the user's actual role
   */
  const getUserRole = () => {
    if (!user) return null;
    return {
      roleId: user?.role?.id || user?.role_id,
      roleName: user?.role?.name || user?.role_name,
    };
  };

  const hasPermission = (permissionCode) => {
    if (!user) return false;

    // Check actual user permissions from backend
    const userPerms = user.permissions || [];
    return userPerms.includes(permissionCode);
  };

  const hasRole = (...roleIds) => {
    if (!user) return false;
    const userRoleId = user?.role?.id || user?.role_id;
    return roleIds.includes(userRoleId);
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    hasPermission,
    hasRole,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
