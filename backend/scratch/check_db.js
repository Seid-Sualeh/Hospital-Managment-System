const db = require("../src/config/db");

async function check() {
  try {
    const isConnected = await db.testConnection();
    if (!isConnected) {
      console.log("Could not connect to database");
      process.exit(1);
    }
    const tables = await db.query("SHOW TABLES");
    console.log("Tables in database:", tables);
    
    // Check if clinics exist
    const clinics = await db.query("SELECT * FROM clinics LIMIT 5");
    console.log("Clinics:", clinics);

    // Check if users exist
    const users = await db.query("SELECT id, email, role_id, clinic_id FROM users LIMIT 5");
    console.log("Users:", users);

    // Check if roles exist
    const roles = await db.query("SELECT * FROM roles LIMIT 5");
    console.log("Roles:", roles);

    process.exit(0);
  } catch (error) {
    console.error("Error during check:", error);
    process.exit(1);
  }
}

check();
