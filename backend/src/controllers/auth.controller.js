const authService = require("../services/auth.service");
const mockAuthService = require("../services/mock-auth.service");
const db = require("../config/db");
const { APIError } = require("../middlewares/error");

const authController = {
  // Login handler
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const tenantId = req.tenantId;
      const SKIP_DB =
        String(process.env.SKIP_DB || "").toLowerCase() === "true";

      if (!tenantId) {
        throw new APIError(
          "Tenant context is missing. Log in through a valid clinic subdomain.",
          400,
          "MISSING_TENANT",
        );
      }

      let loginResult;

      // Use mock auth when SKIP_DB=true (dev/testing mode)
      if (SKIP_DB) {
        try {
          loginResult = await mockAuthService.mockLogin(email, password);
        } catch (mockError) {
          throw new APIError(mockError.message, 401, "INVALID_CREDENTIALS");
        }
      } else {
        // Fetch user from DB, enforcing tenant clinic_id
        const querySql = `
          SELECT u.*, r.name as role_name 
          FROM users u
          JOIN roles r ON u.role_id = r.id
          WHERE u.clinic_id = ? AND u.email = ?
          LIMIT 1
        `;
        const users = await db.query(querySql, [tenantId, email.trim()]);

        if (!users || users.length === 0) {
          throw new APIError(
            "Invalid email or password credentials.",
            401,
            "INVALID_CREDENTIALS",
          );
        }

        const user = users[0];

        if (!user.is_active) {
          throw new APIError(
            "This account has been deactivated. Contact your clinic administrator.",
            403,
            "USER_DEACTIVATED",
          );
        }

        // Validate password via Service
        const isMatch = await authService.comparePasswords(
          password,
          user.password_hash,
        );
        if (!isMatch) {
          throw new APIError(
            "Invalid email or password credentials.",
            401,
            "INVALID_CREDENTIALS",
          );
        }

        // Generate tokens via Service
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
          },
        };
      }

      // Save refresh token in HTTP-Only secure cookie
      res.cookie("refreshToken", loginResult.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
      });

      // Audit Log entry (skip if mock mode)
      if (!SKIP_DB) {
        const ip =
          req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
        await db.query(
          'INSERT INTO audit_logs (clinic_id, user_id, action_type, affected_table, ip_address) VALUES (?, ?, "LOGIN", "users", ?)',
          [tenantId, loginResult.user.id, ip],
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

  // User registration handler (Enforces tenant scope constraints)
  register: async (req, res, next) => {
    try {
      const tenantId = req.tenantId;

      if (!tenantId) {
        throw new APIError("Tenant context is missing.", 400, "MISSING_TENANT");
      }

      // Register clinic employee in service
      const newUser = await authService.registerClinicUser(tenantId, req.body);

      // Security Audit Trail
      const actorId = req.user ? req.user.id : null;
      await db.query(
        'INSERT INTO audit_logs (clinic_id, user_id, action_type, affected_table, affected_record_id) VALUES (?, ?, "CREATE_USER", "users", ?)',
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

  // Token refresh handler
  refresh: async (req, res, next) => {
    try {
      const jwt = require("jsonwebtoken");
      const JWT_REFRESH_SECRET =
        process.env.JWT_REFRESH_SECRET ||
        "another_super_secret_refresh_cryptographic_key_v1";

      let refreshToken = req.cookies?.refreshToken;
      if (!refreshToken && req.body.refreshToken) {
        refreshToken = req.body.refreshToken;
      }

      if (!refreshToken) {
        throw new APIError(
          "Refresh token is missing. Please log in again.",
          401,
          "REFRESH_TOKEN_MISSING",
        );
      }

      let decoded;
      try {
        decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      } catch (err) {
        throw new APIError(
          "Invalid or expired refresh token. Log in again.",
          401,
          "INVALID_REFRESH_TOKEN",
        );
      }

      // Verify user in database
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
          "USER_SESSION_EXPIRED",
        );
      }

      const user = users[0];
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

  // Forgot password handler
  forgotPassword: async (req, res, next) => {
    try {
      const { email } = req.body;
      const tenantId = req.tenantId;

      if (!tenantId) {
        throw new APIError("Tenant context is missing.", 400, "MISSING_TENANT");
      }

      const token = await authService.generateForgotPasswordToken(
        tenantId,
        email,
      );

      // In production, trigger an email client or SMS gateway to send the verification link.
      // Here we mock the integration and return info details for dev visualization.
      const mockResetLink = `https://${req.tenantName ? req.tenantName.toLowerCase().replace(/\s+/g, "") : "yared"}.cms.et/reset-password?token=${token}`;

      // If notification is logged/sent
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
        // Dev helper (do not output in production environment)
        devHelper:
          process.env.NODE_ENV === "development"
            ? { resetLink: mockResetLink, token }
            : undefined,
      });
    } catch (error) {
      next(error);
    }
  },

  // Reset password handler
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

  // Logout handler
  logout: async (req, res, next) => {
    try {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      res.status(200).json({
        success: true,
        message: "Successfully logged out user.",
      });
    } catch (error) {
      next(error);
    }
  },

  // Fetch current user details from JWT token session context
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

      // Fetch permission codes for this role
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
