const db = require('./src/config/db');
const auth = require('./src/services/auth.service');
(async () => {
  try {
    console.log('env host', process.env.DB_HOST, 'name', process.env.DB_NAME);
    const password = 'Password123!';
    const hash = await auth.hashPassword(password);
    console.log('generated hash =', hash);
    const result = await db.query('UPDATE users SET password_hash = ? WHERE id IN (1,2,3,4,5,6)', [hash]);
    console.log('updated rows', result.affectedRows);
    const users = await db.query("SELECT id,email,password_hash,LENGTH(password_hash) as len FROM users ORDER BY id");
    console.log(JSON.stringify(users, null, 2));
    const ok = await auth.comparePasswords(password, users[0].password_hash);
    console.log('password matches?', ok);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
