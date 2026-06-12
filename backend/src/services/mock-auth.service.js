const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "super_secret_cryptographic_signing_key_for_cms_token_security_v1";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ||
  "another_super_secret_refresh_cryptographic_key_v1";
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || "15m";
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "7d";

/**
 * Mock demo users for SKIP_DB=true offline testing
 * Passwords are hashed Password123!
 */
const MOCK_USERS = [
  {
    id: 1,
    clinic_id: 1,
    first_name: "Yared",
    last_name: "Clinic",
    email: "yared@yaredclinic.com",
    phone_number: "251911111111",
    password_hash: "$2a$12$mock_hash_password123", // Password123!
    role_id: 1,
    role_name: "Admin",
    is_active: true,
  },
  {
    id: 2,
    clinic_id: 1,
    first_name: "Almaz",
    last_name: "Doctor",
    email: "almaz@yaredclinic.com",
    phone_number: "251922222222",
    password_hash: "$2a$12$mock_hash_password123", // Password123!
    role_id: 2,
    role_name: "Doctor",
    is_active: true,
  },
  {
    id: 3,
    clinic_id: 1,
    first_name: "Lidya",
    last_name: "Reception",
    email: "lidya@yaredclinic.com",
    phone_number: "251933333333",
    password_hash: "$2a$12$mock_hash_password123", // Password123!
    role_id: 4,
    role_name: "Receptionist",
    is_active: true,
  },
  {
    id: 4,
    clinic_id: 1,
    first_name: "Mulu",
    last_name: "Tsehay",
    email: "mulu@yaredclinic.com",
    phone_number: "251944444444",
    password_hash: "$2a$12$mock_hash_password123",
    role_id: 3,
    role_name: "Triage Nurse",
    is_active: true,
  },
  {
    id: 5,
    clinic_id: 1,
    first_name: "Hana",
    last_name: "Tadesse",
    email: "hana@yaredclinic.com",
    phone_number: "251955555555",
    password_hash: "$2a$12$mock_hash_password123",
    role_id: 5,
    role_name: "Pharmacist",
    is_active: true,
  },
];

/**
 * Mock permission sets for roles
 */
const ROLE_PERMISSIONS = {
  1: [
    "view:dashboard",
    "manage:users",
    "manage:appointments",
    "view:reports",
    "manage:settings",
  ],
  2: [
    "view:dashboard",
    "manage:consultations",
    "view:patients",
    "manage:prescriptions",
  ],
  3: ["view:dashboard", "view:patients", "manage:labs"],
  4: [
    "view:dashboard",
    "manage:appointments",
    "view:patients",
    "manage:billing",
  ],
  5: ["view:dashboard", "manage:stock", "view:patients"],
};

/**
 * Mock Auth Service for SKIP_DB=true mode
 */
class MockAuthService {
  /**
   * Mock password comparison (always compares against "Password123!")
   */
  async comparePasswords(plainPassword, hashedPassword) {
    // For mock, just check if password matches the demo password
    return plainPassword === "Password123!";
  }

  /**
   * Generate mock JWT tokens
   */
  async generateTokens(user) {
    const permissions = ROLE_PERMISSIONS[user.role_id] || [];

    const accessToken = jwt.sign(
      {
        userId: user.id,
        clinicId: user.clinic_id,
        roleId: user.role_id,
        roleName: user.role_name,
        email: user.email,
        permissions: permissions,
      },
      JWT_SECRET,
      { expiresIn: ACCESS_EXPIRY },
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        clinicId: user.clinic_id,
      },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_EXPIRY },
    );

    return { accessToken, refreshToken, permissions };
  }

  /**
   * Mock login: Find user by email in MOCK_USERS and verify password
   */
  async mockLogin(email, password) {
    const user = MOCK_USERS.find((u) => u.email === email.trim().toLowerCase());

    if (!user) {
      throw new Error("Invalid email or password credentials.");
    }

    if (!user.is_active) {
      throw new Error("This account has been deactivated.");
    }

    // Mock password check
    const isMatch = await this.comparePasswords(password, user.password_hash);
    if (!isMatch) {
      throw new Error("Invalid email or password credentials.");
    }

    // Generate tokens
    const { accessToken, refreshToken, permissions } =
      await this.generateTokens(user);

    return {
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
}

module.exports = new MockAuthService();
