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
        'text': 'Text'
    };

    return languageIdMap[languageId.toLowerCase()] || 'Other';
}

// Add other utility functions as needed