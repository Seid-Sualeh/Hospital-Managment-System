const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'ethiopia_cms',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Test connection helper
async function testConnection() {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log(`[Database] Successfully connected to MySQL at ${process.env.DB_HOST}:${process.env.DB_PORT} (DB: ${process.env.DB_NAME})`);
    return true;
  } catch (error) {
    console.error('[Database] Connection failed! Verify that your MySQL server is running and configuration is correct.');
    console.error(`[Database Error] Details: ${error.message}`);
    return false;
  } finally {
    if (connection) connection.release();
  }
}

// Global execution wrapper
async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error(`[Database Query Error] SQL: ${sql}`);
    console.error(`[Database Query Error] Details: ${error.message}`);
    throw error;
  }
}

module.exports = {
  pool,
  query,
  testConnection
};
