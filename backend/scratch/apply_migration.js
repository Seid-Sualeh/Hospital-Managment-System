const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

async function runMigration() {
  console.log('================================================================');
  console.log('CMS SAAS FOR ETHIOPIA - ATTENDANCE MODULE SCHEMA MIGRATOR');
  console.log('================================================================');

  try {
    const migrationFilePath = path.join(__dirname, '../src/config/db_attendance_migration.sql');
    if (!fs.existsSync(migrationFilePath)) {
      console.error(`[Error] Migration SQL file not found at: ${migrationFilePath}`);
      process.exit(1);
    }

    const rawSql = fs.readFileSync(migrationFilePath, 'utf8');
    const dbName = process.env.DB_NAME || 'ethiopia_cms';
    const sqlContent = rawSql.replace(/USE\s+[`'"]?ethiopia_cms[`'"]?/gi, `USE \`${dbName}\``);

    // Split SQL by semicolons, filtering out comments and empty commands
    const rawStatements = sqlContent.split(';');
    const statements = [];

    for (let raw of rawStatements) {
      let cleaned = raw
        .split('\n')
        .map(line => line.trim())
        .filter(line => !line.startsWith('--') && !line.startsWith('#') && line.length > 0)
        .join(' ');
      
      cleaned = cleaned.trim();
      if (cleaned.length > 0) {
        statements.push(cleaned);
      }
    }

    console.log(`[Database] Found ${statements.length} SQL statements to execute.`);

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ethiopia_cms',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      ssl: (process.env.SSL_MODE || process.env.SSLMODE || '').toUpperCase() === 'REQUIRED'
        ? { rejectUnauthorized: String(process.env.DB_SSL_REJECT_UNAUTHORIZED ?? process.env.SSL_REJECT_UNAUTHORIZED ?? 'false') === 'true' }
        : undefined,
      multipleStatements: true,
      connectTimeout: 30000,
    });

    await connection.beginTransaction();
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        console.log(`[Database] Executing statement ${i + 1}/${statements.length}...`);
        await connection.query(stmt);
      } catch (err) {
        if (err.message.includes('Duplicate entry') || err.message.includes('already exists') || err.message.includes('Multiple primary keys')) {
          console.warn(`[Database Warning] Skipping duplicate error: ${err.message}`);
        } else {
          console.error(`[Database Error] Failed statement: ${stmt}`);
          throw err;
        }
      }
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    await connection.commit();
    await connection.end();
    console.log('✔ [Database] Attendance tables migrated successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ [Database Migration Failed] Error details:');
    console.error(error.message || error);
    process.exit(1);
  }
}

runMigration();
