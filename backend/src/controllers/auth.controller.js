const authService = require("../services/auth.service");
const tenantService = require("../services/tenant.service");
const db = require("../config/db");
const { APIError } = require("../middlewares/error");

const authController = {
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const tenantHeader = req.headers["x-tenant-id"] || req.headers["x-tenant-subdomain"];
      const SKIP_DB = String(process.env.SKIP_DB || "").toLowerCase() === "true";

      if (!SKIP_DB && !tenantHeader) {
        throw new APIError(
          "Clinic identifier required. Provide X-Tenant-ID header.",
          400,
          "MISSING_TENANT_IDENTIFIER"
        );
      }

      let tenantId = req.tenantId;
      let clinic = null;

      if (!SKIP_DB && tenantHeader) {
        const subdomain = String(tenantHeader).toLowerCase().trim();
        clinic = await tenantService.getTenantBySubdomain(subdomain);
        if (clinic) {
          tenantId = clinic.id;
        }
      }

      let loginResult;

      if (SKIP_DB) {
        try {
          loginResult = await require("../services/mock-auth.service").mockLogin(email, password);
        } catch (mockError) {
          throw new APIError(mockError.message, 401, "INVALID_CREDENTIALS");
        }
      } else {
        const querySql = `
          SELECT u.*, r.name as role_name 
          FROM users u
          JOIN roles r ON u.role_id = r.id
          WHERE u.clinic_id = ? AND u.email = ? AND u.is_active = TRUE
          LIMIT 1
        `;
        const users = await db.query(querySql, [tenantId, email.trim()]);

        if (!users || users.length === 0) {
          throw new APIError(
            "Invalid email or password credentials.",
            401,
            "INVALID_CREDENTIALS"
          );
        }

        const user = users[0];

        const isMatch = await authService.comparePasswords(
          password,
          user.password_hash
        );
        if (!isMatch) {
          throw new APIError(
            "Invalid email or password credentials.",
            401,
            "INVALID_CREDENTIALS"
          );
        }

        const { accessToken, refreshToken, permissions } =
          await authService.generateTokens(user);

        loginResult = {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            phone_number: user.phone_number,
            permissions,
            role: {
              id: user.role_id,
              name: user.role_name,
            },
            ...(clinic ? { subdomain: clinic.subdomain } : {}),
          },
        };
      }

      res.cookie("refreshToken", loginResult.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      if (tenantId && loginResult.user) {
        const ip =
          req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
        await db.query(
          'INSERT INTO audit_logs (clinic_id, user_id, action_type, affected_table, ip_address) VALUES (?, ?, "LOGIN", "users", ?)',
          [tenantId, loginResult.user.id, ip]
        );
      }

      res.status(200).json({
        success: true,
        accessToken: loginResult.accessToken,
        user: loginResult.user,
      });
    } catch (error) {
      next(error);
    }
  },

  register: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;

      if (!tenantId) {
        throw new APIError("Tenant context is missing.", 400, "MISSING_TENANT");
      }

      const newUser = await authService.registerClinicUser(tenantId, req.body);

      const actorId = req.user ? req.user.id : null;
      await db.query(
        "INSERT INTO audit_logs (clinic_id, user_id, action_type, affected_table, affected_record_id) VALUES (?, ?, 'CREATE_USER', 'users', ?)",
        [tenantId, actorId, newUser.id],
      );

      res.status(201).json({
        success: true,
        message: "Clinic employee registered successfully.",
        data: newUser,
      });
    } catch (error) {
      next(error);
    }
  },

  refresh: async (req, res, next) => {
    try {
      const jwt = require("jsonwebtoken");
      const JWT_REFRESH_SECRET =
        process.env.JWT_REFRESH_SECRET ||
        (process.env.NODE_ENV === "production"
          ? null
          : "dev_only_refresh_secret_change_before_production");

      if (!JWT_REFRESH_SECRET) {
        throw new APIError(
          "Refresh token secret is not configured.",
          500,
          "AUTH_MISCONFIGURED",
        );
      }

      let refreshToken = req.cookies?.refreshToken;
      if (!refreshToken && req.body.refreshToken) {
        refreshToken = req.body.refreshToken;
      }

      if (!refreshToken) {
        throw new APIError(
          "Refresh token is missing. Please log in again.",
          401,
          "REFRESH_TOKEN_MISSING"
        );
      }

      let decoded;
      try {
        decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      } catch (err) {
        throw new APIError(
          "Invalid or expired refresh token. Log in again.",
          401,
          "INVALID_REFRESH_TOKEN"
        );
      }

      const querySql = `
        SELECT u.*, r.name as role_name 
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = ? AND u.clinic_id = ? AND u.is_active = TRUE
        LIMIT 1
      `;
      const users = await db.query(querySql, [
        decoded.userId,
        decoded.clinicId,
      ]);

      if (!users || users.length === 0) {
        throw new APIError(
          "User session expired or user is deactivated.",
          401,
          "USER_SESSION_EXPIRED"
        );
      }

      const user = users[0];

      if (req.tenantId && decoded.clinicId !== req.tenantId) {
        throw new APIError(
          "Cross-tenant session violation during token refresh.",
          403,
          "CROSS_TENANT_VIOLATION",
        );
      }

      const { accessToken: newAccessToken } =
        await authService.generateTokens(user);

      res.status(200).json({
        success: true,
        accessToken: newAccessToken,
      });
    } catch (error) {
      next(error);
    }
  },

  forgotPassword: async (req, res, next) => {
    try {
      const { email } = req.body;
      const tenantId = req.tenantId;

      if (!tenantId) {
        throw new APIError("Tenant context is missing.", 400, "MISSING_TENANT");
      }

      const token = await authService.generateForgotPasswordToken(
        tenantId,
        email
      );

      const mockResetLink = `https://${req.tenantName ? req.tenantName.toLowerCase().replace(/\s+/g, "") : "demo"}.cms.et/reset-password?token=${token}`;

      if (token) {
        const notifySql = `
          INSERT INTO notifications (clinic_id, recipient_type, recipient_id, notification_type, message, status, sent_at)
          SELECT clinic_id, 'user', id, 'email', ?, 'sent', NOW() FROM users WHERE email = ? AND clinic_id = ? LIMIT 1
        `;
        await db.query(notifySql, [
          `You requested a password reset. Click here to reset: ${mockResetLink}`,
          email,
          tenantId,
        ]);
      }

      res.status(200).json({
        success: true,
        message:
          "If the email matches an active account, a password reset link has been dispatched.",
        devHelper:
          process.env.NODE_ENV === "development"
            ? { resetLink: mockResetLink, token }
            : undefined,
      });
    } catch (error) {
      next(error);
    }
  },

  resetPassword: async (req, res, next) => {
    try {
      const { token, password } = req.body;
      const tenantId = req.tenantId;

      if (!tenantId) {
        throw new APIError("Tenant context is missing.", 400, "MISSING_TENANT");
      }

      await authService.resetUserPassword(tenantId, token, password);

      res.status(200).json({
        success: true,
        message:
          "Your password has been successfully reset. Log in with your new credentials.",
      });
    } catch (error) {
      next(error);
    }
  },

  logout: async (req, res, next) => {
    try {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
        path: "/",
      });
      res.status(200).json({
        success: true,
        message: "Successfully logged out user.",
      });
    } catch (error) {
      next(error);
    }
  },

  getMe: async (req, res, next) => {
    try {
      const user = req.user;

      const querySql = `
        SELECT u.id, u.first_name, u.last_name, u.email, u.phone_number, u.role_id, r.name as role_name 
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = ? AND u.clinic_id = ?
        LIMIT 1
      `;
      const users = await db.query(querySql, [user.id, user.clinicId]);

      if (!users || users.length === 0) {
        throw new APIError("User account not found.", 404, "USER_NOT_FOUND");
      }

      const dbUser = users[0];

      const permSql = `
        SELECT p.code 
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ?
      `;
      const permRows = await db.query(permSql, [dbUser.role_id]);
      const permissions = permRows ? permRows.map((r) => r.code) : [];

      res.status(200).json({
        success: true,
        user: {
          id: dbUser.id,
          first_name: dbUser.first_name,
          last_name: dbUser.last_name,
          email: dbUser.email,
          phone_number: dbUser.phone_number,
          role_id: dbUser.role_id,
          role_name: dbUser.role_name,
          permissions,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;