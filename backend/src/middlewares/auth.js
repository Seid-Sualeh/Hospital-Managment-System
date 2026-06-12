const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { APIError } = require("./error");

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "super_secret_cryptographic_signing_key_for_cms_token_security_v1";

/**
 * Authentication check: Verifies JWT token and binds user details to the request context.
 */
async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new APIError(
        "Access token is missing or malformed. Authentication required.",
        401,
        "UNAUTHORIZED",
      );
    }

    const token = authHeader.split(" ")[1];
    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        throw new APIError(
          "Access token has expired. Please refresh your token.",
          401,
          "TOKEN_EXPIRED",
        );
      }
      throw new APIError("Invalid access token.", 401, "INVALID_TOKEN");
    }

    // Bind decoded values
    req.user = {
      id: decoded.userId,
      clinicId: decoded.clinicId,
      roleId: decoded.roleId,
      roleName: decoded.roleName,
      email: decoded.email,
      permissions: decoded.permissions || [],
    };

    // Ensure session boundary matches active tenant identifier
    if (req.tenantId && req.user.clinicId !== req.tenantId) {
      throw new APIError(
        "Cross-tenant data access violation. Session tenant mismatch.",
        403,
        "CROSS_TENANT_VIOLATION",
      );
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Authorization check: Verifies if the authenticated user has a specific permission code.
 * @param {string} permissionCode - The code representing the action (e.g. 'READ_EMR', 'CREATE_PATIENT')
 */
function requirePermission(permissionCode) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new APIError(
          "User context not found. Authenticate request first.",
          401,
          "UNAUTHENTICATED",
        );
      }

      // Bypass permissions for Clinic Administrator (roleId = 1)
      if (
        req.user.roleId === 1 ||
        req.user.roleName === "Clinic Administrator"
      ) {
        return next();
      }

      const userPermissions = req.user.permissions || [];

      if (!userPermissions.includes(permissionCode)) {
        throw new APIError(
          `Access denied. Missing permission: ${permissionCode}`,
          403,
          "INSUFFICIENT_PERMISSIONS",
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new APIError(
          "User context not found. Authenticate request first.",
          401,
          "UNAUTHENTICATED",
        );
      }

      // Clinic Administrator bypasses role restrictions
      if (
        req.user.roleId === 1 ||
        req.user.roleName === "Clinic Administrator"
      ) {
        return next();
      }

      if (allowedRoles.length && !allowedRoles.includes(req.user.roleId)) {
        throw new APIError(
          "Access denied. Role not authorized for this route.",
          403,
          "INSUFFICIENT_ROLE",
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  authenticateUser,
  requirePermission,
  requireRole,
};
