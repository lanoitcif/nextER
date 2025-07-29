# MCP Environment Setup Script
# Run this as Administrator for system-wide changes, or as regular user for user-only changes

param(
    [switch]$SystemWide = $false,
    [switch]$UserOnly = $true
)

Write-Host "=== MCP Environment Setup Script ===" -ForegroundColor Green
Write-Host "Setting up environment for nextER MCP servers..." -ForegroundColor Yellow

# Function to add to PATH if not already present
function Add-ToPath {
    param(
        [string]$PathToAdd,
        [string]$Scope = "User"  # "User" or "Machine"
    )
    
    if (Test-Path $PathToAdd) {
        $currentPath = [Environment]::GetEnvironmentVariable("PATH", $Scope)
        if ($currentPath -notlike "*$PathToAdd*") {
            $newPath = $currentPath + ";" + $PathToAdd
            [Environment]::SetEnvironmentVariable("PATH", $newPath, $Scope)
            Write-Host "✅ Added to PATH: $PathToAdd" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Already in PATH: $PathToAdd" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Path doesn't exist: $PathToAdd" -ForegroundColor Red
    }
}

# Determine scope
$scope = if ($SystemWide) { "Machine" } else { "User" }
Write-Host "Using scope: $scope" -ForegroundColor Cyan

# Check if running as admin for system-wide changes
if ($SystemWide -and -not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ System-wide changes require administrator privileges. Please run as administrator." -ForegroundColor Red
    exit 1
}

Write-Host "`n=== 1. Installing Required Packages ===" -ForegroundColor Cyan

# Install Node.js packages globally
Write-Host "Installing NPM packages globally..." -ForegroundColor Yellow
$npmPackages = @(
    "@upstash/context7-mcp",
    "@modelcontextprotocol/server-memory", 
    "@openbnb/mcp-server-airbnb",
    "@supabase/mcp-server-supabase"
)

foreach ($package in $npmPackages) {
    Write-Host "Installing $package..." -ForegroundColor White
    try {
        npm install -g $package
        Write-Host "✅ Installed: $package" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install: $package" -ForegroundColor Red
    }
}

# Install Python packages
Write-Host "`nInstalling Python packages..." -ForegroundColor Yellow
try {
    Write-Host "Installing mcp_server_fetch..." -ForegroundColor White
    pip install mcp_server_fetch
    Write-Host "✅ Installed: mcp_server_fetch" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install mcp_server_fetch" -ForegroundColor Red
}

Write-Host "`n=== 2. Adding Paths to Environment Variables ===" -ForegroundColor Cyan

# Common paths to add
$pathsToAdd = @()

# Node.js global packages
$nodeGlobalPath = "$env:APPDATA\npm"
if (Test-Path $nodeGlobalPath) {
    $pathsToAdd += $nodeGlobalPath
}

# Python Scripts (multiple possible locations)
$pythonPaths = @(
    "$env:LOCALAPPDATA\Programs\Python\Python*\Scripts",
    "$env:APPDATA\Python\Python*\Scripts",
    "$env:LOCALAPPDATA\Packages\PythonSoftwareFoundation.Python*\LocalCache\local-packages\Python*\Scripts"
)

foreach ($pattern in $pythonPaths) {
    $resolvedPaths = Get-ChildItem $pattern -ErrorAction SilentlyContinue
    foreach ($path in $resolvedPaths) {
        if ($path.PSIsContainer) {
            $pathsToAdd += $path.FullName
        }
    }
}

# WSL paths (if you want to access WSL executables from Windows)
$wslPaths = @(
    "$env:LOCALAPPDATA\Packages\CanonicalGroupLimited.Ubuntu*\LocalState\rootfs\home\*\.local\bin",
    "$env:LOCALAPPDATA\Packages\CanonicalGroupLimited.Ubuntu*\LocalState\rootfs\usr\local\bin"
)

foreach ($pattern in $wslPaths) {
    $resolvedPaths = Get-ChildItem $pattern -ErrorAction SilentlyContinue
    foreach ($path in $resolvedPaths) {
        if ($path.PSIsContainer) {
            $pathsToAdd += $path.FullName
        }
    }
}

# Add paths to environment
foreach ($path in $pathsToAdd) {
    Add-ToPath -PathToAdd $path -Scope $scope
}

Write-Host "`n=== 3. Setting Up WSL for Wikipedia MCP ===" -ForegroundColor Cyan

# Install wikipedia-mcp in WSL
Write-Host "Installing wikipedia-mcp in WSL..." -ForegroundColor Yellow
try {
    wsl bash -c "pip install --user wikipedia-mcp"
    Write-Host "✅ Installed wikipedia-mcp in WSL" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install wikipedia-mcp in WSL. Trying with pipx..." -ForegroundColor Red
    try {
        wsl bash -c "pipx install wikipedia-mcp"
        Write-Host "✅ Installed wikipedia-mcp in WSL with pipx" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install wikipedia-mcp in WSL" -ForegroundColor Red
        Write-Host "Please manually run in WSL: pip install --user wikipedia-mcp" -ForegroundColor Yellow
    }
}

Write-Host "`n=== 4. Setting Environment Variables ===" -ForegroundColor Cyan

# Set OpenWeather API key if not already set
$owmApiKey = "170970e4dc14dc36cd9784b3a9fd8b99"
$currentOwmKey = [Environment]::GetEnvironmentVariable("OWM_API_KEY", $scope)
if (-not $currentOwmKey) {
    [Environment]::SetEnvironmentVariable("OWM_API_KEY", $owmApiKey, $scope)
    Write-Host "✅ Set OWM_API_KEY environment variable" -ForegroundColor Green
} else {
    Write-Host "⚠️  OWM_API_KEY already set" -ForegroundColor Yellow
}

# Set Supabase token
$supabaseToken = "sbp_8aa001018272bef7a0b76fba0f2c8da6efb12d0f"
$currentSupabaseToken = [Environment]::GetEnvironmentVariable("SUPABASE_ACCESS_TOKEN", $scope)
if (-not $currentSupabaseToken) {
    [Environment]::SetEnvironmentVariable("SUPABASE_ACCESS_TOKEN", $supabaseToken, $scope)
    Write-Host "✅ Set SUPABASE_ACCESS_TOKEN environment variable" -ForegroundColor Green
} else {
    Write-Host "⚠️  SUPABASE_ACCESS_TOKEN already set" -ForegroundColor Yellow
}

Write-Host "`n=== 5. Verification ===" -ForegroundColor Cyan

# Test if commands are available
$commandsToTest = @(
    @{Name="node"; Description="Node.js"},
    @{Name="npm"; Description="NPM"},
    @{Name="python"; Description="Python"},
    @{Name="pip"; Description="Python PIP"},
    @{Name="wsl"; Description="Windows Subsystem for Linux"}
)

foreach ($cmd in $commandsToTest) {
    try {
        $null = Get-Command $cmd.Name -ErrorAction Stop
        Write-Host "✅ $($cmd.Description) is available" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($cmd.Description) is not available" -ForegroundColor Red
    }
}

Write-Host "`n=== 6. Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Restart Claude Desktop to pick up environment changes" -ForegroundColor White
Write-Host "2. Update your MCP configuration with the provided JSON" -ForegroundColor White
Write-Host "3. Test each MCP server individually" -ForegroundColor White

Write-Host "`n=== Setup Complete! ===" -ForegroundColor Green
Write-Host "You may need to restart your terminal/applications for PATH changes to take effect." -ForegroundColor Yellow

# Optional: Open the directory where Claude Desktop config should be
$claudeConfigPath = "$env:APPDATA\Claude"
if (Test-Path $claudeConfigPath) {
    Write-Host "`nClaude Desktop config directory: $claudeConfigPath" -ForegroundColor Cyan
    $response = Read-Host "Open Claude config directory? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Start-Process explorer $claudeConfigPath
    }
}