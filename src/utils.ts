export function formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
}

/**
 * Detects programming language from file extension
 */
export function detectLanguageFromFile(filePath: string): string {
    if (!filePath) {
        return 'unknown';
    }

    const extension = filePath.split('.').pop()?.toLowerCase();
    
    // Map file extensions to language names
    const languageMap: { [key: string]: string } = {
        // JavaScript/TypeScript family
        'js': 'JavaScript',
        'mjs': 'JavaScript',
        'jsx': 'JavaScript',
        'ts': 'TypeScript',
        'tsx': 'TypeScript',
        
        // Python
        'py': 'Python',
        'pyw': 'Python',
        'pyc': 'Python',
        'pyo': 'Python',
        'pyd': 'Python',
        
        // Java/JVM languages
        'java': 'Java',
        'kt': 'Kotlin',
        'kts': 'Kotlin',
        'scala': 'Scala',
        'groovy': 'Groovy',
        
        // C family
        'c': 'C',
        'h': 'C',
        'cpp': 'C++',
        'cxx': 'C++',
        'cc': 'C++',
        'hpp': 'C++',
        'hxx': 'C++',
        'cs': 'C#',
        
        // Web technologies
        'html': 'HTML',
        'htm': 'HTML',
        'css': 'CSS',
        'scss': 'SCSS',
        'sass': 'Sass',
        'less': 'Less',
        'vue': 'Vue',
        'svelte': 'Svelte',
        
        // PHP
        'php': 'PHP',
        'php3': 'PHP',
        'php4': 'PHP',
        'php5': 'PHP',
        'phps': 'PHP',
        'phtml': 'PHP',
        
        // Ruby
        'rb': 'Ruby',
        'rbw': 'Ruby',
        
        // Go
        'go': 'Go',
        
        // Rust
        'rs': 'Rust',
        
        // Swift
        'swift': 'Swift',
        
        // Dart
        'dart': 'Dart',
        
        // Shell scripts
        'sh': 'Shell',
        'bash': 'Shell',
        'zsh': 'Shell',
        'fish': 'Shell',
        'ps1': 'PowerShell',
        'psm1': 'PowerShell',
        'psd1': 'PowerShell',
        
        // SQL
        'sql': 'SQL',
        
        // R
        'r': 'R',
        
        // MATLAB
        'm': 'MATLAB',
        
        // Lua
        'lua': 'Lua',
        
        // Perl
        'pl': 'Perl',
        'pm': 'Perl',
        
        // Haskell
        'hs': 'Haskell',
        
        // Elixir
        'ex': 'Elixir',
        'exs': 'Elixir',
        
        // F#
        'fs': 'F#',
        'fsx': 'F#',
        'fsi': 'F#',
        
        // Clojure
        'clj': 'Clojure',
        'cljs': 'Clojure',
        'cljc': 'Clojure',
        
        // Configuration files
        'json': 'JSON',
        'xml': 'XML',
        'yaml': 'YAML',
        'yml': 'YAML',
        'toml': 'TOML',
        'ini': 'INI',
        'cfg': 'Config',
        'conf': 'Config',
        
        // Documentation
        'md': 'Markdown',
        'markdown': 'Markdown',
        'rst': 'reStructuredText',
        'tex': 'LaTeX',
        
        // Other
        'dockerfile': 'Dockerfile',
        'makefile': 'Makefile',
        'cmake': 'CMake',
        'gradle': 'Gradle',
        'properties': 'Properties'
    };

    if (extension && languageMap[extension]) {
        return languageMap[extension];
    }

    // Check for special filenames without extensions
    const filename = filePath.split(/[\\\/]/).pop()?.toLowerCase();
    if (filename) {
        if (filename === 'dockerfile') return 'Dockerfile';
        if (filename === 'makefile') return 'Makefile';
        if (filename === 'cmakelists.txt') return 'CMake';
        if (filename === 'package.json') return 'JSON';
        if (filename === 'tsconfig.json') return 'JSON';
        if (filename.includes('requirements.txt')) return 'Text';
        if (filename.includes('.env')) return 'Environment';
    }

    return 'Other';
}

/**
 * Detects programming language from VS Code language ID
 */
export function detectLanguageFromLanguageId(languageId: string): string {
    if (!languageId) {
        return 'unknown';
    }

    // Map VS Code language IDs to our language names
    const languageIdMap: { [key: string]: string } = {
        'javascript': 'JavaScript',
        'javascriptreact': 'JavaScript',
        'typescript': 'TypeScript',
        'typescriptreact': 'TypeScript',
        'python': 'Python',
        'java': 'Java',
        'kotlin': 'Kotlin',
        'scala': 'Scala',
        'c': 'C',
        'cpp': 'C++',
        'csharp': 'C#',
        'html': 'HTML',
        'css': 'CSS',
        'scss': 'SCSS',
        'sass': 'Sass',
        'less': 'Less',
        'vue': 'Vue',
        'svelte': 'Svelte',
        'php': 'PHP',
        'ruby': 'Ruby',
        'go': 'Go',
        'rust': 'Rust',
        'swift': 'Swift',
        'dart': 'Dart',
        'shellscript': 'Shell',
        'powershell': 'PowerShell',
        'sql': 'SQL',
        'r': 'R',
        'matlab': 'MATLAB',
        'lua': 'Lua',
        'perl': 'Perl',
        'haskell': 'Haskell',
        'elixir': 'Elixir',
        'fsharp': 'F#',
        'clojure': 'Clojure',
        'json': 'JSON',
        'jsonc': 'JSON',
        'xml': 'XML',
        'yaml': 'YAML',
        'toml': 'TOML',
        'ini': 'INI',
        'markdown': 'Markdown',
        'latex': 'LaTeX',
        'dockerfile': 'Dockerfile',
        'makefile': 'Makefile',
        'cmake': 'CMake',
        'gradle': 'Gradle',
        'properties': 'Properties',
        'plaintext': 'Text',
        'text': 'Text',
        
        // Special activity types
        'terminal': 'Terminal',
        'copilot-chat': 'Copilot Chat',
        'github-copilot-chat': 'Copilot Chat',
        'interactive': 'AI Chat',
        'chat': 'AI Chat',
        'cursor-chat': 'Cursor Chat',
        'claude-code': 'Claude Code',
        'gemini-cli': 'Gemini CLI',
        'cline': 'Cline',
        'aider': 'Aider',
        'continue': 'Continue',
        'kilocode': 'Kilo Code',
        'codeium-chat': 'Codeium Chat',
        'tabnine-chat': 'Tabnine Chat',
        'amazon-q': 'Amazon Q',
        'cody': 'Cody',
        'bito': 'Bito AI',
        'mintlify': 'Mintlify',
        'pieces': 'Pieces',
        'blackbox': 'Blackbox AI'
    };

    return languageIdMap[languageId.toLowerCase()] || 'Other';
}

/**
 * Detects activity type from URI scheme and document properties
 * Returns special activity types like 'Terminal', 'Copilot Chat', etc.
 */
export function detectActivityFromUri(uri: string, languageId?: string): string {
    if (!uri) {
        return 'unknown';
    }

    const uriLower = uri.toLowerCase();
    
    // Check for terminal-related schemes
    if (uriLower.includes('output:') && uriLower.includes('terminal')) {
        return 'Terminal';
    }
    
    // Check for GitHub Copilot Chat
    if (uriLower.includes('copilot') || uriLower.includes('github.copilot')) {
        return 'Copilot Chat';
    }
    
    // Check for Cline (formerly Claude Dev)
    if (uriLower.includes('cline') || uriLower.includes('saoudrizwan.claude-dev')) {
        return 'Cline';
    }
    
    // Check for Continue
    if (uriLower.includes('continue') || uriLower.includes('continue.continue')) {
        return 'Continue';
    }
    
    // Check for Aider
    if (uriLower.includes('aider')) {
        return 'Aider';
    }
    
    // Check for Kilo Code
    if (uriLower.includes('kilocode') || uriLower.includes('kilo-code') || uriLower.includes('kilocode.kilocode')) {
        return 'Kilo Code';
    }
    
    // Check for Codeium Chat
    if (uriLower.includes('codeium')) {
        return 'Codeium Chat';
    }
    
    // Check for Tabnine Chat
    if (uriLower.includes('tabnine')) {
        return 'Tabnine Chat';
    }
    
    // Check for Amazon Q
    if (uriLower.includes('amazon') && uriLower.includes('q')) {
        return 'Amazon Q';
    }
    
    // Check for Cody (Sourcegraph)
    if (uriLower.includes('cody') || uriLower.includes('sourcegraph')) {
        return 'Cody';
    }
    
    // Check for Bito AI
    if (uriLower.includes('bito')) {
        return 'Bito AI';
    }
    
    // Check for Mintlify
    if (uriLower.includes('mintlify')) {
        return 'Mintlify';
    }
    
    // Check for Pieces
    if (uriLower.includes('pieces')) {
        return 'Pieces';
    }
    
    // Check for Blackbox AI
    if (uriLower.includes('blackbox')) {
        return 'Blackbox AI';
    }
    
    // Check for Cursor-specific schemes
    if (uriLower.includes('cursor')) {
        return 'Cursor Chat';
    }
    
    // Check for Claude
    if (uriLower.includes('claude')) {
        return 'Claude Code';
    }
    
    // Generic interactive/chat windows (fallback)
    if (uriLower.includes('interactive') || uriLower.includes('chat')) {
        return 'AI Chat';
    }
    
    // If languageId hints at chat/interactive, use it
    if (languageId) {
        const detectedFromId = detectLanguageFromLanguageId(languageId);
        const aiActivityTypes = [
            'Terminal', 'Copilot Chat', 'AI Chat', 'Cursor Chat', 'Claude Code', 
            'Gemini CLI', 'Cline', 'Aider', 'Continue', 'Kilo Code', 'Codeium Chat',
            'Tabnine Chat', 'Amazon Q', 'Cody', 'Bito AI', 'Mintlify', 'Pieces', 'Blackbox AI'
        ];
        if (aiActivityTypes.includes(detectedFromId)) {
            return detectedFromId;
        }
    }
    
    return 'unknown';
}

// Add other utility functions as needed