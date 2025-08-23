#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Cleanup script to remove generated test files and temporary artifacts
 */

const cleanupPaths = [
    // VS Code test runner cache
    '.vscode-test',
    
    // Compiled test output
    'out/test',
    
    // Coverage reports (if any)
    'coverage',
    '.nyc_output',
    
    // Test artifacts
    'test-results.xml',
    'junit.xml',
    
    // Node modules test cache
    'node_modules/.cache',
    
    // OS specific files
    '.DS_Store',
    'Thumbs.db',
    
    // Temporary log files
    '*.log',
    'logs/'
];

const additionalPatterns = [
    // Compiled JavaScript files in test directories
    'src/test/**/*.js',
    'src/test/**/*.js.map',
    
    // Backup files
    '**/*.bak',
    '**/*~',
    
    // Temporary test databases
    '**/*.test.db',
    '**/*.test.sqlite'
];

function removeDirectory(dirPath) {
    if (fs.existsSync(dirPath)) {
        try {
            fs.rmSync(dirPath, { recursive: true, force: true });
            console.log(`✅ Removed directory: ${dirPath}`);
        } catch (error) {
            console.log(`❌ Failed to remove directory ${dirPath}:`, error.message);
        }
    }
}

function removeFile(filePath) {
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            console.log(`✅ Removed file: ${filePath}`);
        } catch (error) {
            console.log(`❌ Failed to remove file ${filePath}:`, error.message);
        }
    }
}

function removeByPattern(pattern) {
    const glob = require('glob');
    try {
        const files = glob.sync(pattern, { dot: true });
        files.forEach(file => {
            if (fs.lstatSync(file).isDirectory()) {
                removeDirectory(file);
            } else {
                removeFile(file);
            }
        });
        if (files.length > 0) {
            console.log(`✅ Removed ${files.length} files matching pattern: ${pattern}`);
        }
    } catch (error) {
        console.log(`❌ Failed to process pattern ${pattern}:`, error.message);
    }
}

function main() {
    console.log('🧹 Starting test cleanup...\n');
    
    // Clean up directories and files
    cleanupPaths.forEach(pathItem => {
        const fullPath = path.resolve(pathItem);
        if (pathItem.includes('*')) {
            removeByPattern(pathItem);
        } else if (fs.existsSync(fullPath)) {
            if (fs.lstatSync(fullPath).isDirectory()) {
                removeDirectory(fullPath);
            } else {
                removeFile(fullPath);
            }
        }
    });
    
    // Clean up by patterns (requires glob)
    try {
        additionalPatterns.forEach(pattern => {
            removeByPattern(pattern);
        });
    } catch (error) {
        console.log('⚠️  Pattern matching requires glob package. Install with: npm install glob');
    }
    
    console.log('\n✨ Test cleanup completed!');
}

if (require.main === module) {
    main();
}

module.exports = { main };
