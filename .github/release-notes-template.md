# Release Notes Template

This template is used by the GitHub Actions workflow to generate consistent release notes.

## Template Variables
- `{{VERSION}}` - The release version number
- `{{TYPE}}` - Either "release" or "beta"
- `{{CHANGES}}` - Extracted changelog entries
- `{{PR_LIST}}` - Related pull request information
- `{{DATE}}` - Release date

## Standard Format

```markdown
# ✨ What's New in v{{VERSION}}

{{TYPE == "beta" ? "⚠️ **This is a beta release for testing purposes. Please report any issues.**" : "🎉 **This is a stable release with new features and improvements!**"}}

## 📋 Changes in this Release
{{CHANGES}}

{{PR_LIST ? "## 🔗 Related Pull Requests" : ""}}
{{PR_LIST}}

## 🔗 Links
* 📖 [Complete Documentation](https://github.com/twentyTwo/vsc-ext-coding-time-tracker/wiki)
* 🐛 [Report Issues](https://github.com/twentyTwo/vsc-ext-coding-time-tracker/issues)
* 💬 [Discussions](https://github.com/twentyTwo/vsc-ext-coding-time-tracker/discussions)

## 📦 Installation
* **VS Code**: [Install from Marketplace](https://marketplace.visualstudio.com/items?itemName=noorashuvo.simple-coding-time-tracker)
* **Other Editors**: [Download from Open VSX](https://open-vsx.org/extension/noorashuvo/simple-coding-time-tracker)

---
**Full Changelog**: https://github.com/twentyTwo/vsc-ext-coding-time-tracker/compare/v{{PREVIOUS_VERSION}}...v{{VERSION}}
```

## Character Guidelines

- Use standard ASCII emojis: ✨ 📋 🔗 📖 🐛 💬 📦 🎉 ⚠️
- Avoid Unicode characters that may not render properly
- Stick to GitHub-supported emoji shortcodes when possible
- Use consistent formatting with proper markdown headings