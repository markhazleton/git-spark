#Requires -Version 5.1

<#
.SYNOPSIS
    Git Spark HTML Report Generator - PowerShell CLI

.DESCRIPTION
    This PowerShell script provides a comprehensive command-line interface
    for generating HTML reports from Git repositories using git-spark.

.PARAMETER RepoPath
    Path to the Git repository to analyze (default: current directory)

.PARAMETER OutputPath
    Directory where the HTML report will be saved (default: ./reports)

.PARAMETER Days
    Number of days to analyze from today backwards

.PARAMETER Since
    Start date for analysis in YYYY-MM-DD format

.PARAMETER Until
    End date for analysis in YYYY-MM-DD format

.PARAMETER Branch
    Specific branch to analyze

.PARAMETER Author
    Filter commits by author name or email

.PARAMETER PathPattern
    Filter files using glob pattern (e.g., "**/*.ts")

.PARAMETER Heavy
    Enable expensive analyses for more detailed insights

.PARAMETER Open
    Automatically open the HTML report in the default browser

.PARAMETER Serve
    Start an HTTP server to serve the report

.PARAMETER Port
    Port number for the HTTP server (default: 3000)

.EXAMPLE
    .\git-spark-html.ps1
    Generate a basic HTML report for the current repository

.EXAMPLE
    .\git-spark-html.ps1 -Days 30 -Heavy
    Analyze the last 30 days with detailed analysis

.EXAMPLE
    .\git-spark-html.ps1 -Serve -Port 8080
    Generate report and start server on port 8080

.EXAMPLE
    .\git-spark-html.ps1 -Branch "main" -Author "john@example.com" -Since "2024-01-01"
    Analyze main branch, filter by author, from specific date

.EXAMPLE
    .\git-spark-html.ps1 -PathPattern "**/*.ts" -OutputPath "./typescript-reports"
    Analyze only TypeScript files and save to custom directory
#>

[CmdletBinding()]
param(
    [Parameter(HelpMessage = "Path to the Git repository")]
    [Alias("r")]
    [string]$RepoPath = $PWD,
    
    [Parameter(HelpMessage = "Output directory for HTML report")]
    [Alias("o")]
    [string]$OutputPath = "./reports",
    
    [Parameter(HelpMessage = "Number of days to analyze")]
    [Alias("d")]
    [int]$Days,
    
    [Parameter(HelpMessage = "Start date (YYYY-MM-DD)")]
    [Alias("s")]
    [string]$Since,
    
    [Parameter(HelpMessage = "End date (YYYY-MM-DD)")]
    [Alias("u")]
    [string]$Until,
    
    [Parameter(HelpMessage = "Branch to analyze")]
    [Alias("b")]
    [string]$Branch,
    
    [Parameter(HelpMessage = "Author to filter by")]
    [Alias("a")]
    [string]$Author,
    
    [Parameter(HelpMessage = "Path pattern to filter files")]
    [Alias("p")]
    [string]$PathPattern,
    
    [Parameter(HelpMessage = "Enable heavy analysis")]
    [switch]$Heavy,
    
    [Parameter(HelpMessage = "Open report in browser")]
    [switch]$Open,
    
    [Parameter(HelpMessage = "Start HTTP server")]
    [switch]$Serve,
    
    [Parameter(HelpMessage = "Server port")]
    [int]$Port = 3000
)

# Color functions for better output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    
    $colorMap = @{
        "Red"     = [ConsoleColor]::Red
        "Green"   = [ConsoleColor]::Green
        "Yellow"  = [ConsoleColor]::Yellow
        "Blue"    = [ConsoleColor]::Blue
        "Cyan"    = [ConsoleColor]::Cyan
        "Magenta" = [ConsoleColor]::Magenta
        "White"   = [ConsoleColor]::White
        "Gray"    = [ConsoleColor]::Gray
    }
    
    Write-Host $Message -ForegroundColor $colorMap[$Color]
}

function Write-Header {
    param([string]$Title)
    
    Write-Host ""
    Write-ColorOutput ">>> $Title <<<" "Cyan"
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✓ $Message" "Green"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "✗ $Message" "Red"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠ $Message" "Yellow"
}

function Write-Info {
    param([string]$Message)
    Write-ColorOutput "ℹ $Message" "Blue"
}

# Main execution
try {
    Write-Header "Git Spark HTML Report Generator"
    
    # Validate repository path
    if (!(Test-Path $RepoPath)) {
        Write-Error "Repository path does not exist: $RepoPath"
        exit 1
    }
    
    # Check if it's a Git repository
    Push-Location $RepoPath
    try {
        $gitCheck = git rev-parse --git-dir 2>$null
        if (!$gitCheck) {
            Write-Error "The specified path is not a Git repository: $RepoPath"
            exit 1
        }
    }
    finally {
        Pop-Location
    }
    
    Write-Info "Repository: $RepoPath"
    Write-Info "Output Directory: $OutputPath"
    
    # Build command arguments
    $arguments = @(
        "scripts/cli-html-demo.ts",
        "--repo", "`"$RepoPath`"",
        "--output", "`"$OutputPath`"",
        "--port", $Port
    )
    
    if ($Days) {
        $arguments += "--days", $Days
        Write-Info "Analyzing last $Days days"
    }
    
    if ($Since) {
        $arguments += "--since", $Since
        Write-Info "Start Date: $Since"
    }
    
    if ($Until) {
        $arguments += "--until", $Until
        Write-Info "End Date: $Until"
    }
    
    if ($Branch) {
        $arguments += "--branch", $Branch
        Write-Info "Branch: $Branch"
    }
    
    if ($Author) {
        $arguments += "--author", $Author
        Write-Info "Author Filter: $Author"
    }
    
    if ($PathPattern) {
        $arguments += "--path-pattern", $PathPattern
        Write-Info "Path Pattern: $PathPattern"
    }
    
    if ($Heavy) {
        $arguments += "--heavy"
        Write-Info "Heavy Analysis: Enabled"
    }
    
    if ($Open) {
        $arguments += "--open"
        Write-Info "Auto-open in browser: Yes"
    }
    
    if ($Serve) {
        $arguments += "--serve"
        Write-Info "HTTP Server: Will start on port $Port"
    }
    
    Write-Host ""
    Write-ColorOutput "Executing: npx ts-node $($arguments -join ' ')" "Gray"
    Write-Host ""
    
    # Execute the command
    $process = Start-Process -FilePath "npx" -ArgumentList "ts-node", $arguments -NoNewWindow -Wait -PassThru
    
    if ($process.ExitCode -eq 0) {
        Write-Success "HTML report generation completed successfully!"
        
        # Provide next steps
        Write-Host ""
        Write-ColorOutput "🎯 Next Steps:" "Cyan"
        Write-ColorOutput "   📖 View Report: Open $OutputPath\git-spark-report.html" "White"
        if (!$Serve) {
            Write-ColorOutput "   🌐 Start Server: .\git-spark-html.ps1 -Serve -Port $Port" "White"
        }
        Write-ColorOutput "   🔄 Regenerate: .\git-spark-html.ps1 -Days 60 -Heavy" "White"
        Write-ColorOutput "   📤 Share: The HTML file is self-contained and portable" "White"
    }
    else {
        Write-Error "HTML report generation failed with exit code: $($process.ExitCode)"
        exit $process.ExitCode
    }
}
catch {
    Write-Error "An error occurred: $($_.Exception.Message)"
    Write-Host $_.ScriptStackTrace
    exit 1
}

# Display usage examples if no parameters provided
if ($PSBoundParameters.Count -eq 0) {
    Write-Host ""
    Write-ColorOutput "💡 Usage Examples:" "Yellow"
    Write-Host ""
    Write-Host "  Basic report:"
    Write-ColorOutput "    .\git-spark-html.ps1" "Gray"
    Write-Host ""
    Write-Host "  Last 30 days with heavy analysis:"
    Write-ColorOutput "    .\git-spark-html.ps1 -Days 30 -Heavy" "Gray"
    Write-Host ""
    Write-Host "  Start server to view report:"
    Write-ColorOutput "    .\git-spark-html.ps1 -Serve -Port 8080" "Gray"
    Write-Host ""
    Write-Host "  Filter by author and date:"
    Write-ColorOutput "    .\git-spark-html.ps1 -Author 'john@example.com' -Since '2024-01-01'" "Gray"
    Write-Host ""
    Write-Host "  Analyze TypeScript files only:"
    Write-ColorOutput "    .\git-spark-html.ps1 -PathPattern '**/*.ts'" "Gray"
    Write-Host ""
    Write-Host "  Complete analysis with all options:"
    Write-ColorOutput "    .\git-spark-html.ps1 -Days 60 -Branch main -Heavy -Serve" "Gray"
    Write-Host ""
}