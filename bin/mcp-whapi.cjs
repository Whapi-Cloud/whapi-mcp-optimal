#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.resolve(__dirname, '..', 'server.mjs');

const cp = spawn(process.execPath, ['--experimental-modules', serverPath], {
  stdio: 'inherit',
  env: process.env,
});
cp.on('exit', (code) => process.exit(code || 0));
