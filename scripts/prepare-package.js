#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const marketplace = process.argv[2]; // 'vscode' or 'openvsx'

if (!marketplace || !['vscode', 'openvsx'].includes(marketplace)) {
  console.error('Usage: node prepare-package.js <vscode|openvsx>');
  process.exit(1);
}

// Load configurations
const configPath = path.join(__dirname, 'marketplace-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Store original for restoration if needed
const backupPath = path.join(__dirname, '..', 'package.json.backup');
if (!fs.existsSync(backupPath)) {
  fs.writeFileSync(backupPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log('📦 Created package.json backup');
}

// Apply marketplace-specific overrides
const marketplaceConfig = config[marketplace];

console.log(`\n🔧 Preparing package.json for ${marketplace.toUpperCase()}...\n`);

// Apply each override with logging
Object.keys(marketplaceConfig).forEach(key => {
  const oldValue = packageJson[key];
  packageJson[key] = marketplaceConfig[key];
  
  console.log(`✓ ${key}:`);
  console.log(`  Before: ${JSON.stringify(oldValue)}`);
  console.log(`  After:  ${JSON.stringify(marketplaceConfig[key])}`);
});

// Write updated package.json
fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');

console.log('\n✅ package.json updated successfully for ' + marketplace.toUpperCase());
