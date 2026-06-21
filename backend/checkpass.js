const db = require('./src/config/db');
const auth = require('./src/services/auth.service');
(async () => {
  try {
    const users = await db.query("SELECT email, password_hash, clinic_id, role_id FROM users WHERE email = 'yared@yaredclinic.com' LIMIT 1");
    console.log('found', users.length);
    if (users.length === 0) process.exit(1);
    const u = users[0];
    console.log(u);
    const ok = await auth.comparePasswords('Password123!', u.password_hash);
    console.log('password matches?', ok);
    process.exit(ok ? 0 : 2);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
