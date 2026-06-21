const fs = require("fs");
const path = require("path");
const db = require("../src/config/db");

async function runMigrations() {
  try {
    const isConnected = await db.testConnection();
    if (!isConnected) {
      console.error("Database connection failed. Migration aborted.");
      process.exit(1);
    }

    const sqlFilePath = path.join(__dirname, "../src/config/db_indexes.sql");
    const sqlContent = fs.readFileSync(sqlFilePath, "utf8");
    
    // Split statements, filtering out comments and empty statements
    const statements = sqlContent
      .split(";")
      .map(stmt => stmt.replace(/--.*$/gm, "").trim())
      .filter(stmt => stmt.length > 0);

    console.log(`Found ${statements.length} migration statements to execute.`);

    for (const stmt of statements) {
      console.log(`Executing: ${stmt}`);
      try {
        await db.query(stmt);
        console.log("Successfully executed statement.");
      } catch (err) {
        if (err.code === "ER_DUP_KEYNAME" || err.message.includes("Duplicate key name")) {
          console.warn("Index already exists. Skipping.");
        } else {
          console.error(`Error executing statement: ${err.message}`);
        }
      }
    }

    console.log("Migration complete.");
    process.exit(0);
  } catch (error) {
    console.error(`Migration script failed: ${error.message}`);
    process.exit(1);
  }
}

runMigrations();
