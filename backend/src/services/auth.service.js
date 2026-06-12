const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const { APIError } = require('../middlewares/error');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_cryptographic_signing_key_for_cms_token_security_v1';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'another_super_secret_refresh_cryptographic_key_v1';
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

class AuthService {
  /**
   * Hashes plain text password using bcrypt
   */
  async hashPassword(password) {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compares plain text password against database hash
   */
  async comparePasswords(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Generates JWT Access and Refresh tokens
   */
  async generateTokens(user) {
    // Query permission codes for this user's role
    const permSql = `
      SELECT p.code 
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ?
    `;
    const rows = await db.query(permSql, [user.role_id]);
    const permissions = rows ? rows.map(r => r.code) : [];

    const accessToken = jwt.sign(
      {
        userId: user.id,
        clinicId: user.clinic_id,
        roleId: user.role_id,
        roleName: user.role_name,
        email: user.email,
        permissions: permissions
      },
      JWT_SECRET,
      { expiresIn: ACCESS_EXPIRY }
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        clinicId: user.clinic_id
      },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_EXPIRY }
    );

    return { accessToken, refreshToken, permissions };
  }

  /**
   * Registers a new clinic employee (user) in the tenant database
   */
  async registerClinicUser(clinicId, userData) {
    const { first_name, last_name, email, phone_number, password, role_id } = userData;

    // Check duplicate email under this clinic
    const [existingEmail] = await db.query(
      'SELECT id FROM users WHERE clinic_id = ? AND email = ? LIMIT 1',
      [clinicId, email.trim()]
    );
    if (existingEmail) {
      throw new APIError('User with this email is already registered in this clinic.', 409, 'EMAIL_EXISTS');
    }

    // Check duplicate phone under this clinic (scaped to multi-tenant isolation)
    const [existingPhone] = await db.query(
      'SELECT id FROM users WHERE clinic_id = ? AND phone_number = ? LIMIT 1',
      [clinicId, phone_number.trim()]
    );
    if (existingPhone) {
      throw new APIError('User with this phone number is already registered in this clinic.', 409, 'PHONE_EXISTS');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Insert user
    const insertSql = `
      INSERT INTO users (
        clinic_id, first_name, last_name, email, phone_number, password_hash, role_id, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
    `;
    const result = await db.query(insertSql, [
      clinicId,
      first_name.trim(),
      last_name.trim(),
      email.trim(),
      phone_number.trim(),
      passwordHash,
      role_id
    ]);

    return {
      id: result.insertId,
      first_name,
      last_name,
      email,
      phone_number,
      role_id
    };
  }

  /**
   * Generates a password reset token and saves it in the database
   */
  async generateForgotPasswordToken(clinicId, email) {
    // Check if user exists
    const [user] = await db.query(
      'SELECT id FROM users WHERE clinic_id = ? AND email = ? AND is_active = TRUE LIMIT 1',
      [clinicId, email.trim()]
    );

    if (!user) {
      // For security, don't reveal if email does not exist; pretend it succeeded or log silently.
      // But we will throw a mock error or handle gracefully
      return null;
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    // Set expiry to 1 hour from now
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    // Update user record
    await db.query(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [token, expires, user.id]
    );

    return token;
  }

  /**
   * Resets password using verification token
   */
  async resetUserPassword(clinicId, token, newPassword) {
    // Find user with non-expired token
    const [user] = await db.query(
      `SELECT id FROM users 
       WHERE clinic_id = ? AND reset_token = ? AND reset_token_expires > NOW() AND is_active = TRUE 
       LIMIT 1`,
      [clinicId, token]
    );

    if (!user) {
      throw new APIError('Invalid or expired password reset token.', 400, 'INVALID_RESET_TOKEN');
    }

    // Hash new password
    const passwordHash = await this.hashPassword(newPassword);

    // Update password and clear token columns
    await db.query(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [passwordHash, user.id]
    );

    return true;
  }
}

module.exports = new AuthService();
