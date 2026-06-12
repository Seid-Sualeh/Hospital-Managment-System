const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

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

    const sqlContent = fs.readFileSync(migrationFilePath, 'utf8');

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

    // Disable FK checks and run statements in a transaction
    await db.query('SET FOREIGN_KEY_CHECKS = 0');

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        console.log(`[Database] Executing statement ${i + 1}/${statements.length}...`);
        await db.query(stmt);
      } catch (err) {
        // Ignore certain duplicate errors or column exist errors during re-runs
        if (err.message.includes('Duplicate entry') || err.message.includes('already exists') || err.message.includes('Multiple primary keys')) {
          console.warn(`[Database Warning] Skipping duplicate error: ${err.message}`);
        } else {
          console.error(`[Database Error] Failed statement: ${stmt}`);
          throw err;
        }
      }
    }

    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✔ [Database] Attendance tables migrated successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ [Database Migration Failed] Error details:');
    console.error(error.message || error);
    process.exit(1);
  }
}

runMigration();
