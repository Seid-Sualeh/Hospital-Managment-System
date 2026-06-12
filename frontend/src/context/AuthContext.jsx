import React, { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/authService";
import { ROLE_IDS } from "../constants/roles";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [viewAsRole, setViewAsRole] = useState(null); // For role-based view switching
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
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
        setViewAsRole(null); // Reset view-as when logging in
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
      setViewAsRole(null);
    }
  };

  /**
   * For Admins: Switch to viewing the interface as a different role
   */
  const switchViewRole = (roleId, roleName) => {
    if (!user || user.role?.id !== ROLE_IDS.ADMIN) return;
    setViewAsRole({ roleId, roleName });
  };

  /**
   * Reset view back to actual admin role
   */
  const resetViewRole = () => {
    setViewAsRole(null);
  };

  /**
   * Get the effective role being displayed (either view-as role or actual role)
   */
  const getEffectiveRole = () => {
    if (viewAsRole) {
      return viewAsRole;
    }
    return {
      roleId: user?.role?.id || user?.role_id,
      roleName: user?.role?.name || user?.role_name,
    };
  };

  const getEffectiveUser = () => {
    if (!user) return null;
    const effectiveRole = getEffectiveRole();
    return {
      ...user,
      role: {
        id: effectiveRole.roleId,
        name: effectiveRole.roleName,
      },
      role_id: effectiveRole.roleId,
      role_name: effectiveRole.roleName,
    };
  };

  const effectiveUser = getEffectiveUser();

  const hasPermission = (permissionCode) => {
    if (!effectiveUser) return false;

    const effectiveRole = getEffectiveRole();

    // Admin always has all permissions
    if (effectiveRole.roleId === ROLE_IDS.ADMIN) return true;

    // If viewing as a role, simulate that role's permissions
    if (viewAsRole) {
      // Mock permissions for demo roles
      const mockRolePerms = {
        2: [
          "view:dashboard",
          "manage:consultations",
          "view:patients",
          "manage:prescriptions",
        ], // Doctor
        4: [
          "view:dashboard",
          "manage:appointments",
          "view:patients",
          "manage:billing",
        ], // Receptionist
      };
      return (mockRolePerms[viewAsRole.roleId] || []).includes(permissionCode);
    }

    const userPerms = user.permissions || [];
    return userPerms.includes(permissionCode);
  };

  const hasRole = (...roleIds) => {
    if (!user) return false;
    const effectiveRole = getEffectiveRole();
    if (effectiveRole.roleId === ROLE_IDS.ADMIN) return true;
    return roleIds.includes(effectiveRole.roleId);
  };

  const value = {
    user,
    effectiveUser,
    loading,
    error,
    login,
    logout,
    hasPermission,
    hasRole,
    isAuthenticated: !!user,
    viewAsRole,
    switchViewRole,
    resetViewRole,
    getEffectiveRole,
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
