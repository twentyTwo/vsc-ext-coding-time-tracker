# Contributing to VSCode Time Tracker

We're excited that you're interested in contributing to VSCode Time Tracker! This document will guide you through the process of setting up the project, making changes, and submitting your contributions.

## Project Structure

The project is organized as follows:

vscode-time-tracker/
├── .vscode/                # VSCode-specific settings
├── src/                    # Source code
│   ├── extension.ts        # Main extension file
│   ├── statusBar.ts        # Status bar functionality
│   ├── summaryView.ts      # Summary view implementation
│   ├── timeTracker.ts      # Time tracking logic
│   ├── database.ts         # Database operations
│   └── readme.md           # Source code documentation
├── .gitignore              # Git ignore file
├── package.json            # Project metadata and dependencies
├── README.md               # Project readme
├── CONTRIBUTING.md         # This file
├── LICENSE                 # License information
└── prompts.txt             # Prompts for AI assistance (if applicable)

## Setting Up the Development Environment

1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```
   git clone https://github.com/your-username/vscode-time-tracker.git
   ```
3. Navigate to the project directory:
   ```
   cd vscode-time-tracker
   ```
4. Install dependencies:
   ```
   npm install
   ```

## Compiling the Extension

To compile the extension, run:

`npm run compile`

This will transpile the TypeScript files to JavaScript.

## Testing

To run the tests, use:
`npm test`

Make sure to write tests for any new functionality you add.

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

## Making Changes

1. Create a new branch for your feature or bug fix:
   ```
   git checkout -b feature/your-feature-name
   ```
2. Make your changes and commit them with a clear, descriptive commit message.
3. Push your changes to your fork:
   ```
   git push origin feature/your-feature-name
   ```

## Creating a Pull Request

1. Go to the original repository on GitHub.
2. Click on "Pull requests" and then "New pull request".
3. Select your fork and the branch containing your changes.
4. Fill out the pull request template with a clear description of your changes.
5. Submit the pull request.

## Code Style and Guidelines

- Follow the existing code style in the project.
- Use meaningful variable and function names.
- Comment your code where necessary, especially for complex logic.
- Ensure your code passes all existing tests and add new tests for new functionality.

## Questions or Need Help?

If you have any questions or need assistance, please open an issue on the GitHub repository, and we'll be happy to help!

Thank you for contributing to VSCode Time Tracker!