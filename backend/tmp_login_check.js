const http = require('http');
const data = JSON.stringify({ email: 'yared@yaredclinic.com', password: 'Password123!' });
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'X-Tenant-ID': 'yared'
  }
};
const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('status', res.statusCode);
    console.log('headers', res.headers);
    try { console.log(JSON.parse(body)); } catch (e) { console.log(body); }
    process.exit(0);
  });
});
req.on('error', (err) => { console.error(err); process.exit(1); });
req.write(data);
req.end();
