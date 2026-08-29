# Contributing to Simple Coding Insights

Thank you for your interest in contributing to Simple Coding Insights! We welcome contributions from developers of all skill levels. This guide will walk you through our development workflow and help you make your first contribution.

## 🚀 Quick Start for Contributors

1. **Fork** the repository to your GitHub account
2. **Clone** your fork and set up the development environment
3. **Create** a feature branch for your changes
4. **Make** your changes and test thoroughly
5. **Submit** a pull request to the `develop` branch for review

**Important:** All pull requests should target the `develop` branch, not `main`. This allows for proper testing before merging to production.

## Project Structure

The project is organized as follows:

```bash
vscode-time-tracker/
├── .vscode/               # VSCode-specific settings
├── src/                   # Source code
│   ├── extension.ts       # Main extension file (includes test data commands)
│   ├── statusBar.ts       # Status bar functionality
│   ├── summaryView.ts     # Summary view implementation
│   ├── timeTracker.ts     # Time tracking logic
│   ├── database.ts        # Database operations
│   ├── healthNotifications.ts # Health notification system
│   ├── logger.ts          # Logging utilities
│   └── utils.ts           # Utility functions
├── .gitignore             # Git ignore file
├── package.json           # Project metadata, dependencies, and test commands
├── README.md              # Project readme
├── CONTRIBUTING.md        # Contributing guidelines
├── TECHNICAL.md           # Technical documentation and testing guide
└── LICENSE                # License information
```

## 🛠️ Setting Up the Development Environment

### Step 1: Fork the Repository

1. Go to [https://github.com/twentyTwo/vsc-ext-coding-time-tracker](https://github.com/twentyTwo/vsc-ext-coding-time-tracker)
2. Click the **"Fork"** button in the top-right corner
3. This creates a copy of the repository under your GitHub account

### Step 2: Clone Your Fork

```bash
# Clone your forked repository
git clone https://github.com/YOUR-USERNAME/vsc-ext-coding-time-tracker.git

# Navigate to the project directory
cd vsc-ext-coding-time-tracker

# Add the upstream repository (original repo)
git remote add upstream https://github.com/twentyTwo/vsc-ext-coding-time-tracker.git

# Verify remotes
git remote -v
```

You should see:
- `origin` - Your fork (where you push changes)
- `upstream` - Original repo (where you pull updates)

### Step 3: Install Dependencies

```bash
npm install
```

This installs all required packages including TypeScript, webpack, and VSCode extension dependencies.

### Step 4: Open in VS Code

```bash
code .
```

## Compiling the Extension

To compile the extension, run:

`npm run compile`

This will transpile the TypeScript files to JavaScript.

## Testing the Extension

### Development Mode Testing

For testing during development:

1. **Open the project in VS Code**
2. **Press F5** to launch Extension Development Host
3. **Test your changes** in the new VS Code window

### Package Testing

For testing packaged extensions:

1. **Enable test commands**:
   - Open Settings (`Ctrl+,`)
   - Search `"enableDevCommands"`
   - Enable "Simple Coding Insights › Enable Dev Commands"

2. **Generate test data**:
   - Press `Ctrl+Shift+P`
   - Run `SCI: Generate Test Data (Dev)`
   - This creates 90 days of realistic test data

3. **Test all features**:
   - Summary view and charts
   - Search and filtering
   - Status bar functionality
   - Theme compatibility

4. **Clean up**:
   - Run `SCI: Delete Test Data (Dev)` to remove test data
   - Disable dev commands when done

### Testing Checklist

Before submitting a pull request, verify:

- ✅ Time tracking starts/stops correctly
- ✅ Status bar updates in real-time
- ✅ Charts render properly in light/dark themes
- ✅ Search and filtering work correctly
- ✅ Data persists across VS Code restarts
- ✅ Health notifications function (if enabled)
- ✅ Extension works with packaged installation
- ✅ No console errors in Developer Tools

## Creating a VSCode Package

To package the extension for distribution:

1. Install `vsce` globally if you haven't already:
   ```
   npm install -g vsce
   ```
2. Package the extension:
   ```
   vsce package
   ```

This will create a `.vsix` file that can be installed in VSCode.

## 🔄 Development Workflow

### Step 1: Sync with Upstream

Before starting work, make sure your fork is up-to-date:

```bash
# Fetch latest changes from upstream
git fetch upstream

# Switch to develop branch
git checkout develop

# Merge upstream changes
git merge upstream/develop

# Push updates to your fork
git push origin develop
```

###📝 Code Style and Guidelines

### TypeScript Best Practices

- **Type Safety:** Always use proper TypeScript types, avoid `any` when possible
- **Naming Conventions:**
  - `camelCase` for variables and functions
  - `PascalCase` for classes and interfaces
  - `UPPER_CASE` for constants
- **File Organization:** Keep related functionality together
- **Error Handling:** Use try-catch blocks and log errors appropriately

### Code Quality Checklist

Before submitting a PR, ensure:

- ✅ **No TypeScript errors:** Run `npm run compile` without errors
- ✅ **Meaningful names:** Variables, functions, and classes have descriptive names
- ✅ **Comments:** Complex logic is explained with comments
- ✅ **No console.logs:** Use the `logger` utility instead
- ✅ **Formatting:** Code follows the existing style in the project
- ✅ **No unused imports:** Clean up unused code and imports
- ✅ **Performance:** Consider performance implications of your changes

### Example Code Style

```typescript
// Good: Clear interface definition with proper types
interface CodingSession {
    projectName: string;
    branchName: string;
    language: string;
    duration: number;
    timestamp: number;
}

// Good: Well-documented function
/**
 * Calculates total coding time for a specific project
 * @param projectName The name of the project
 * @param startDate Start date for calculation (timestamp)
 * @param endDate End date for calculation (timestamp)
 * @returns Total time in milliseconds
 */
function calculateProjectTime(
    projectName: string,
    startDate: number,
    endDate: number
): number {
    // Implementation here
}
```

## 🎯 What to Contribute

### Good First Issues

Looking for where to start? Check out issues labeled:
- `good first issue` - Perfect for newcomers
- `help wanted` - Areas where we need assistance
- `bug` - Bug fixes are always welcome

### Contribution Ideas

- 🐛 **Bug fixes** - Fix reported bugs or issues you encounter
- ✨ **New features** - Add new functionality (discuss in an issue first)
- 📚 **Documentation** - Improve README, wiki, or code comments
- 🎨 **UI/UX improvements** - Enhance the user interface
- 🧪 **Tests** - Add or improve test coverage
- ♿ **Accessibility** - Improve accessibility features
- 🌍 **Internationalization** - Add language translations

### Before Starting Major Work

For significant changes or new features:
1. **Open an issue first** to discuss your idea
2. Wait for feedback from maintainers
3. This prevents duplicate work and ensures alignment with project goals

## 🐛 Reporting Bugs

Found a bug? Help us fix it!

1. **Check existing issues** - Your bug might already be reported
2. **Create a new issue** with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected behavior vs actual behavior
   - VS Code version and OS
   - Extension version
   - Screenshots/logs if applicable

## 💬 Questions or Need Help?

- 💬 **GitHub Discussions** - Ask questions and discuss ideas
- 🐛 **GitHub Issues** - Report bugs or request features
- 📖 **Wiki** - Check the [documentation wiki](https://github.com/twentyTwo/vsc-ext-coding-time-tracker/wiki)
- 📧 **Email** - Reach out to maintainers for sensitive issues

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You!

Every contribution, no matter how small, helps make Simple Coding Time Tracker better. We appreciate your time and effort in improving this project for the developer community!

Happy coding! 🚀
git checkout -b feature/add-weekly-chart

# Example: Fixing a bug
git checkout -b fix/timer-reset-issue
```

### Step 3: Make Your Changes

1. **Write code** following the project's code style
2. **Test thoroughly** using the methods described below
3. **Commit regularly** with clear, descriptive messages

```bash
# Stage your changes
git add .

# Commit with a meaningful message
git commit -m "Add weekly chart visualization to summary view"

# For multiple commits, use this format:
git commit -m "feat: add weekly chart component"
git commit -m "test: add unit tests for weekly chart"
git commit -m "docs: update README with weekly chart feature"
```

**Commit Message Guidelines:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Adding or updating tests
- `refactor:` - Code refactoring
- `style:` - Formatting changes
- `chore:` - Maintenance tasks

### Step 4: Push to Your Fork

```bash
# Push your feature branch to your fork
git push origin feature/add-weekly-chart
```

If this is your first push on this branch, Git will provide a link to create a pull request.

## 🔀 Creating a Pull Request

### Important: Target the `develop` Branch

**All pull requests must be submitted to the `develop` branch**, not `main`. The `develop` branch is used for testing and integration before merging to production (`main`).

### Steps to Create a PR:

1. **Go to your fork** on GitHub (https://github.com/YOUR-USERNAME/vsc-ext-coding-time-tracker)
2. You'll see a yellow banner saying **"Compare & pull request"** - click it
3. **Verify the base and compare branches:**
   - Base repository: `twentyTwo/vsc-ext-coding-time-tracker`
   - Base branch: `develop` ⚠️ **Must be develop, not main!**
   - Head repository: `YOUR-USERNAME/vsc-ext-coding-time-tracker`
   - Compare branch: `feature/your-feature-name`
4. **Fill out the PR template:**
   - **Title:** Clear, concise description (e.g., "Add weekly chart visualization")
   - **Description:** Explain what changes you made and why
   - **Testing:** Describe how you tested your changes
   - **Screenshots:** Add screenshots/GIFs if UI changes are involved
5. **Click "Create pull request"**

### PR Description Template:

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- List key changes
- Be specific about what was added/modified/removed

## Testing Performed
- [ ] Tested in development mode (F5)
- [ ] Tested with packaged extension (.vsix)
- [ ] Tested in light and dark themes
- [ ] Verified no console errors
- [ ] Tested on [OS name and version]

## Screenshots (if applicable)
Add screenshots or GIFs demonstrating the changes.

## Related Issues
Closes #issue_number (if applicable)
```

### What Happens Next?

1. **Automated checks** may run (if configured)
2. **Maintainer review** - I'll review your code and provide feedback
3. **Testing** - Changes will be tested in the `develop` branch
4. **Approval & merge** - Once approved, your PR will be merged to `develop`
5. **Release** - After testing, changes from `develop` will be merged to `main` and released

## 🔄 Keeping Your Fork Updated

If your PR takes time to review, keep your branch updated:

```bash
# Fetch latest changes
git fetch upstream

# Switch to your feature branch
git checkout feature/your-feature-name

# Rebase on top of upstream develop
git rebase upstream/develop

# Force push to your fork (since history changed)
git push --force-with-lease origin feature/your-feature-name
```

## Code Style and Guidelines

- Follow the existing code style in the project.
- Use meaningful variable and function names.
- Comment your code where necessary, especially for complex logic.
- Ensure your code passes all existing tests and add new tests for new functionality.

## Questions or Need Help?

If you have any questions or need assistance, please open an issue on the GitHub repository, and we'll be happy to help!

Thank you for contributing to Simple Coding Insights!
