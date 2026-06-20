const mysql = require("mysql2/promise");
const path = require("path");
const dotenv = require("dotenv");

const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath, override: true });

const sslMode = (
  process.env.SSL_MODE ||
  process.env.SSLMODE ||
  ""
).toUpperCase();
const useSsl = sslMode === "REQUIRED";
const sslRejectUnauthorized = String(
  process.env.DB_SSL_REJECT_UNAUTHORIZED ??
    process.env.SSL_REJECT_UNAUTHORIZED ??
    "false",
).toLowerCase();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password:
    process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "",
  database: process.env.DB_NAME || "ethiopia_cms",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  ssl: useSsl
    ? { rejectUnauthorized: sslRejectUnauthorized !== "true" ? false : true }
    : undefined,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "10", 10),
  queueLimit: 0,
  connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || "10000", 10),
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

function isTransientDbError(error) {
  const transientCodes = [
    "PROTOCOL_CONNECTION_LOST",
    "ECONNRESET",
    "ETIMEDOUT",
    "EHOSTUNREACH",
    "ENETUNREACH",
    "ECONNREFUSED",
    "ER_CON_COUNT_ERROR",
  ];
  return transientCodes.includes(error.code);
}

// Test connection helper
async function testConnection() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log(
      `[Database] Successfully connected to MySQL at ${process.env.DB_HOST}:${process.env.DB_PORT} (DB: ${process.env.DB_NAME})`,
    );
    return true;
  } catch (error) {
    console.error(
      "[Database] Connection failed! Verify that your MySQL server is running and configuration is correct.",
    );
    console.error(`[Database Error] Details: ${error.message}`);
    return false;
  } finally {
    if (connection) connection.release();
  }
}

// Global execution wrapper with transient retry handling
async function query(sql, params) {
  let connection;
  let attempt = 0;
  const maxAttempts = 2;

  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      connection = await pool.getConnection();
      const [results] = await connection.execute(sql, params);
      return results;
    } catch (error) {
      console.error(`[Database Query Error] SQL: ${sql}`);
      console.error(`[Database Query Error] Details: ${error.message}`);

      if (connection) {
        try {
          connection.release();
        } catch (releaseError) {
          console.error("[Database] Failed to release connection:", releaseError.message);
        }
        connection = null;
      }

      if (attempt >= maxAttempts || !isTransientDbError(error)) {
        throw error;
      }

      console.warn(
        `[Database] Retrying transient error (${error.code || error.message}). Attempt ${attempt + 1}/${maxAttempts}...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      if (connection) {
        try {
          connection.release();
        } catch (releaseError) {
          console.error("[Database] Failed to release connection:", releaseError.message);
        }
      }
    }
  }
}

module.exports = {
  pool,
  query,
  testConnection,
};
