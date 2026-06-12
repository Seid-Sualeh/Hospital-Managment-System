module.exports = {
  apps: [
    {
      name: 'ethiopia-cms-backend',
      script: 'server.js',
      instances: 'max', // Utilizing all available CPU cores in cluster mode
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        DB_HOST: 'localhost',
        DB_USER: 'cms_admin',
        DB_PASSWORD: 'AdminSecurePass2026!',
        DB_NAME: 'ethiopia_cms',
        JWT_SECRET: 'JwtProductionSecretSignKey2026!'
      },
      error_file: './logs/pm2_err.log',
      out_file: './logs/pm2_out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      combine_logs: true,
      merge_logs: true
    }
  ]
};
