# PowerShell script to clean up test generated files
# Usage: .\scripts\cleanup-test-files.ps1

param(
    [switch]$All,
    [switch]$TestOnly,
    [switch]$VerboseOutput
)

Write-Host "🧹 Starting test cleanup..." -ForegroundColor Cyan

# Define cleanup paths
$cleanupPaths = @(
    ".vscode-test",
    "out\test",
    "coverage",
    ".nyc_output",
    "test-results.xml",
    "junit.xml",
    "node_modules\.cache",
    "logs"
)

$additionalPaths = @(
    "out",
    "dist",
    "*.log"
)

function Remove-PathSafely {
    param([string]$Path)
    
    if (Test-Path $Path) {
        try {
            if ((Get-Item $Path).PSIsContainer) {
                Remove-Item $Path -Recurse -Force
                if ($VerboseOutput) { Write-Host "✅ Removed directory: $Path" -ForegroundColor Green }
            } else {
                Remove-Item $Path -Force
                if ($VerboseOutput) { Write-Host "✅ Removed file: $Path" -ForegroundColor Green }
            }
        }
        catch {
            Write-Host "❌ Failed to remove $Path : $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Clean test-specific files
foreach ($path in $cleanupPaths) {
    Remove-PathSafely $path
}

# Clean additional files if -All switch is used
if ($All) {
    Write-Host "🗑️  Performing full cleanup..." -ForegroundColor Yellow
    foreach ($path in $additionalPaths) {
        Remove-PathSafely $path
    }
}

# Clean log files using wildcards
Get-ChildItem -Path "." -Filter "*.log" -File | ForEach-Object {
    Remove-PathSafely $_.FullName
}

# Clean temporary test databases
Get-ChildItem -Path "." -Filter "*.test.db" -Recurse -File | ForEach-Object {
    Remove-PathSafely $_.FullName
}

Write-Host ""
Write-Host "✨ Test cleanup completed!" -ForegroundColor Green

if ($All) {
    Write-Host "💡 You may want to run 'npm install' to restore dependencies" -ForegroundColor Yellow
}
