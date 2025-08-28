// Simple test script to verify language detection functionality
// This can be removed after testing

const { detectLanguageFromFile, detectLanguageFromLanguageId } = require('./dist/extension.js');

// Test file extension detection
console.log('Testing file extension detection:');
console.log('test.js:', detectLanguageFromFile('test.js')); // Should be JavaScript
console.log('test.ts:', detectLanguageFromFile('test.ts')); // Should be TypeScript
console.log('test.py:', detectLanguageFromFile('test.py')); // Should be Python
console.log('test.java:', detectLanguageFromFile('test.java')); // Should be Java
console.log('test.cpp:', detectLanguageFromFile('test.cpp')); // Should be C++
console.log('test.html:', detectLanguageFromFile('test.html')); // Should be HTML
console.log('test.css:', detectLanguageFromFile('test.css')); // Should be CSS
console.log('test.unknown:', detectLanguageFromFile('test.unknown')); // Should be Other
console.log('package.json:', detectLanguageFromFile('package.json')); // Should be JSON

// Test VS Code language ID detection
console.log('\nTesting VS Code language ID detection:');
console.log('javascript:', detectLanguageFromLanguageId('javascript')); // Should be JavaScript
console.log('typescript:', detectLanguageFromLanguageId('typescript')); // Should be TypeScript
console.log('python:', detectLanguageFromLanguageId('python')); // Should be Python
console.log('csharp:', detectLanguageFromLanguageId('csharp')); // Should be C#
console.log('unknown:', detectLanguageFromLanguageId('unknown')); // Should be Other
