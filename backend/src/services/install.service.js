const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const mysql = require("mysql2/promise");
const { APIError } = require("../middlewares/error");

dotenv.config({ path: path.resolve(__dirname, "../../.env"), override: true });

const INSTALL_SQL_DIR = path.join(__dirname, "../config");

function loadSqlFile(fileName) {
  const filePath = path.join(INSTALL_SQL_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    throw new APIError(
      `SQL file not found: ${fileName}`,
      500,
      "SQL_FILE_NOT_FOUND",
    );
  }
  return fs.readFileSync(filePath, "utf8");
}

function getInstallConnectionConfig() {
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

  return {
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "root",
    password:
      process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    ssl: useSsl
      ? { rejectUnauthorized: sslRejectUnauthorized !== "true" ? false : true }
      : undefined,
    multipleStatements: true,
    connectTimeout: 30000,
  };
}

function prepareSqlForDb(sql) {
  const dbName = process.env.DB_NAME || "ethiopia_cms";
  return sql
    .replace(/CREATE\s+DATABASE\s+IF\s+NOT\s+EXISTS\s+[`'"]?ethiopia_cms[`'",]?/gi, `CREATE DATABASE IF NOT EXISTS \`${dbName}\``)
    .replace(/USE\s+[`'"]?ethiopia_cms[`'"]?/gi, `USE \`${dbName}\``);
}

async function installDatabase() {
  const connection = await mysql.createConnection(getInstallConnectionConfig());

  try {
    await connection.beginTransaction();

    const sqlFiles = [
      "db_init.sql",
      "db_seed.sql",
      "db_attendance_migration.sql",
      "db_settings_migration.sql",
    ];

    const results = [];
    for (const fileName of sqlFiles) {
      const sql = prepareSqlForDb(loadSqlFile(fileName));
      if (!sql.trim()) {
        throw new APIError(
          `SQL file ${fileName} contains no statements.`,
          500,
          "EMPTY_SQL_FILE",
        );
      }

      results.push({ fileName, statementCount: sql.split(";").length });
      await connection.query(sql);
    }

    await connection.commit();
    return {
      message: "Database schema created, migrations applied, and seed data inserted successfully.",
      executedFiles: sqlFiles,
      executedFilesCount: sqlFiles.length,
      results,
    };
  } catch (error) {
    await connection.rollback().catch(() => {
      // ignore rollback failure and keep original error
    });
    throw error;
  } finally {
    await connection.end();
  }
}

module.exports = {
  installDatabase,
};
