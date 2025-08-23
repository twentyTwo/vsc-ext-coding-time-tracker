# Test Cleanup Utilities

This directory contains utilities for cleaning up generated test files and temporary artifacts from the VS Code Simple Coding Time Tracker extension testing.

## Available Cleanup Methods

### 1. CMake (Cross-platform)

```bash
# Show available targets
cmake --build . --target help

# Clean test artifacts only
cmake --build . --target clean-test-files

# Clean compiled output
cmake --build . --target clean-compiled

# Reset VS Code test cache
cmake --build . --target reset-vscode-test

# Complete cleanup
cmake --build . --target clean-all

# Clean and run fresh tests
cmake --build . --target test-clean
```

### 2. NPM Scripts

```bash
# Clean test artifacts
npm run clean

# Complete cleanup (test files + compiled output)
npm run clean:all

# Clean test cache and recompile
npm run clean:test

# Reset and run fresh tests
npm run reset:test
```

### 3. Node.js Script (Cross-platform)

```bash
# Direct execution
node scripts/cleanup-test-files.js
```

### 4. PowerShell (Windows)

```powershell
# Basic cleanup
.\scripts\cleanup-test-files.ps1

# Complete cleanup
.\scripts\cleanup-test-files.ps1 -All

# Verbose output
.\scripts\cleanup-test-files.ps1 -VerboseOutput
```

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

## Usage Scenarios

### Before Running Tests
```bash
# Clean slate testing
npm run reset:test
```

### After Test Development
```bash
# Clean up test artifacts
npm run clean
```

### Complete Environment Reset
```bash
# Nuclear option - clean everything
npm run clean:all
npm install  # Reinstall dependencies
```

### CI/CD Pipeline
```bash
# Clean before test run
cmake --build . --target clean-test-files
npm test
```

## Integration with Development Workflow

1. **Pre-commit**: Run `npm run clean` to remove temporary files
2. **Testing**: Use `npm run reset:test` for fresh test runs
3. **Debugging**: Use `npm run clean:test` to clear cached test data
4. **Release**: Use `npm run clean:all` before packaging

## Troubleshooting

### Permission Issues
If you encounter permission errors:
- On Windows: Run PowerShell as Administrator
- On Unix: Use `sudo` if necessary
- Check file locks from running processes

### Missing Dependencies
Some cleanup features require additional packages:
```bash
npm install -g rimraf  # For cross-platform file removal
npm install glob       # For pattern matching
```

### Performance
- Large projects: Use targeted cleanup (`clean:test`) instead of full cleanup
- Frequent testing: Consider using `test:watch` mode instead of repeated cleanup

## Customization

To add custom cleanup paths, edit:
- `scripts/cleanup-test-files.js` - Node.js script
- `scripts/cleanup-test-files.ps1` - PowerShell script
- `CMakeLists.txt` - CMake targets
- `package.json` - NPM scripts
