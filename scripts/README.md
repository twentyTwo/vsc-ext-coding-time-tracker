# Test Cleanup Utilities

This directory contains utilities for cleaning up generated test files and temporary artifacts from the VS Code Simple Coding Time Tracker extension testing.

## Available Scripts

### cleanup-test-files.js
Cross-platform Node.js script for comprehensive test artifact cleanup.

**Features:**
- Removes VS Code test cache and compiled test output
- Cleans coverage reports and temporary files
- Handles log files and test databases
- Pattern-based file removal with glob support
- Comprehensive logging of cleanup operations

### cleanup-test-files.ps1
Windows PowerShell script optimized for Windows environments.

**Features:**
- Windows-specific file handling
- Multiple cleanup levels (`-All`, `-TestOnly`)
- Verbose output option (`-VerboseOutput`)
- Safe file removal with error handling
- Integration with Windows file system

## What Gets Cleaned

### Test Artifacts
- `.vscode-test/` - VS Code test runner cache
- `out/test/` - Compiled test JavaScript files
- `coverage/`, `.nyc_output/` - Coverage reports
- `test-results.xml`, `junit.xml` - Test result files

### Temporary Files
- `*.log` - Log files
- `logs/` - Log directories
- `*.test.db`, `*.test.sqlite` - Temporary test databases
- `**/*.bak`, `**/*~` - Backup files

### Build Artifacts (with -All flag)
- `out/` - Compiled JavaScript
- `dist/` - Distribution files
- `node_modules/.cache` - Node.js cache

### Generated Files
- `src/test/**/*.js` - Compiled test JavaScript
- `src/test/**/*.js.map` - Source maps

## Integration Points

These cleanup utilities are integrated with:
- **CMake targets** (see `CMakeLists.txt`)
- **NPM scripts** (see `package.json`)
- **CI/CD pipelines** (GitHub Actions)
- **Development workflow** (pre-commit hooks)

## Usage Examples and Documentation

For complete usage examples, integration guides, and troubleshooting information, see:
- **[TECHNICAL.md](../TECHNICAL.md#test-cleanup-utilities)** - Complete testing documentation
- **[CMakeLists.txt](../CMakeLists.txt)** - CMake target definitions
- **[package.json](../package.json)** - NPM script definitions

## Customization

To add custom cleanup paths:
1. **Node.js script**: Edit `cleanupPaths` and `additionalPatterns` arrays
2. **PowerShell script**: Modify `$cleanupPaths` and `$additionalPaths` variables
3. **CMake targets**: Update target commands in `CMakeLists.txt`
4. **NPM scripts**: Add new scripts in `package.json`
