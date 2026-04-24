const dotenv = require('dotenv');
const path = require('path');

const envConfig = dotenv.config({
  path: path.resolve(__dirname, '.env'),
}).parsed || {};

module.exports = {
  apps: [{
    name: 'eventura-api',
    cwd: '/home/ubuntu/Eventura/apps/api',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: { ...envConfig, NODE_ENV: 'production' },
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    error_file: '/home/ubuntu/logs/eventura-api-error.log',
    out_file: '/home/ubuntu/logs/eventura-api-out.log',
    time: true,
  }],
};
