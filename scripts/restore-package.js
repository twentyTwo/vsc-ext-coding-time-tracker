#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const backupPath = path.join(__dirname, '..', 'package.json.backup');
const packagePath = path.join(__dirname, '..', 'package.json');

if (fs.existsSync(backupPath)) {
  const backup = fs.readFileSync(backupPath, 'utf8');
  fs.writeFileSync(packagePath, backup);
  fs.unlinkSync(backupPath);
  console.log('✅ package.json restored from backup');
} else {
  console.log('ℹ️  No backup found, using git checkout');
  require('child_process').execSync('git checkout package.json', { stdio: 'inherit' });
}
