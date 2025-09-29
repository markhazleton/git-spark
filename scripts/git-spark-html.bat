@echo off
REM Git Spark HTML Report Generator - Windows CLI
REM This batch file provides easy command-line access to generate HTML reports

setlocal enabledelayedexpansion

REM Default values
set "REPO_PATH=%CD%"
set "OUTPUT_PATH=./reports"
set "DAYS="
set "HEAVY="
set "OPEN="
set "SERVE="
set "PORT=3000"
set "BRANCH="
set "AUTHOR="
set "SINCE="
set "UNTIL="
set "PATH_PATTERN="

REM Parse command line arguments
:parse
if "%~1"=="" goto :run
if "%~1"=="--help" goto :help
if "%~1"=="-h" goto :help
if "%~1"=="--repo" (
    set "REPO_PATH=%~2"
    shift & shift
    goto :parse
)
if "%~1"=="-r" (
    set "REPO_PATH=%~2"
    shift & shift
    goto :parse
)
if "%~1"=="--output" (
    set "OUTPUT_PATH=%~2"
    shift & shift
    goto :parse
)
if "%~1"=="-o" (
    set "OUTPUT_PATH=%~2"
    shift & shift
    goto :parse
)
if "%~1"=="--days" (
    set "DAYS=--days %~2"
    shift & shift
    goto :parse
)
if "%~1"=="-d" (
    set "DAYS=--days %~2"
    shift & shift
    goto :parse
)
if "%~1"=="--branch" (
    set "BRANCH=--branch %~2"
    shift & shift
    goto :parse
)
if "%~1"=="-b" (
    set "BRANCH=--branch %~2"
    shift & shift
    goto :parse
)
if "%~1"=="--author" (
    set "AUTHOR=--author %~2"
    shift & shift
    goto :parse
)
if "%~1"=="-a" (
    set "AUTHOR=--author %~2"
    shift & shift
    goto :parse
)
if "%~1"=="--since" (
    set "SINCE=--since %~2"
    shift & shift
    goto :parse
)
if "%~1"=="-s" (
    set "SINCE=--since %~2"
    shift & shift
    goto :parse
)
if "%~1"=="--until" (
    set "UNTIL=--until %~2"
    shift & shift
    goto :parse
)
if "%~1"=="-u" (
    set "UNTIL=--until %~2"
    shift & shift
    goto :parse
)
if "%~1"=="--path-pattern" (
    set "PATH_PATTERN=--path-pattern %~2"
    shift & shift
    goto :parse
)
if "%~1"=="-p" (
    set "PATH_PATTERN=--path-pattern %~2"
    shift & shift
    goto :parse
)
if "%~1"=="--heavy" (
    set "HEAVY=--heavy"
    shift
    goto :parse
)
if "%~1"=="--open" (
    set "OPEN=--open"
    shift
    goto :parse
)
if "%~1"=="--serve" (
    set "SERVE=--serve"
    shift
    goto :parse
)
if "%~1"=="--port" (
    set "PORT=%~2"
    shift & shift
    goto :parse
)
echo Unknown option: %~1
goto :help

:run
echo.
echo ^>^>^> Git Spark HTML Report Generator ^<^<^<
echo.

REM Build the command
set "CMD=npx ts-node scripts/cli-html-demo.ts --repo "%REPO_PATH%" --output "%OUTPUT_PATH%" --port %PORT%"
if defined DAYS set "CMD=!CMD! %DAYS%"
if defined BRANCH set "CMD=!CMD! %BRANCH%"
if defined AUTHOR set "CMD=!CMD! %AUTHOR%"
if defined SINCE set "CMD=!CMD! %SINCE%"
if defined UNTIL set "CMD=!CMD! %UNTIL%"
if defined PATH_PATTERN set "CMD=!CMD! %PATH_PATTERN%"
if defined HEAVY set "CMD=!CMD! %HEAVY%"
if defined OPEN set "CMD=!CMD! %OPEN%"
if defined SERVE set "CMD=!CMD! %SERVE%"

echo Running: !CMD!
echo.

REM Execute the command
!CMD!

goto :end

:help
echo.
echo Git Spark HTML Report Generator
echo.
echo Usage: git-spark-html.bat [options]
echo.
echo Options:
echo   -r, --repo ^<path^>           Repository path to analyze (default: current directory)
echo   -o, --output ^<path^>         Output directory (default: ./reports)
echo   -d, --days ^<number^>         Analyze last N days
echo   -s, --since ^<date^>          Start date (YYYY-MM-DD)
echo   -u, --until ^<date^>          End date (YYYY-MM-DD)
echo   -b, --branch ^<name^>         Analyze specific branch
echo   -a, --author ^<name^>         Filter by author
echo   -p, --path-pattern ^<glob^>   Filter by file path pattern
echo   --heavy                    Enable expensive analyses
echo   --open                     Open report in browser
echo   --serve                    Start HTTP server
echo   --port ^<number^>             Server port (default: 3000)
echo   -h, --help                 Show this help
echo.
echo Examples:
echo   git-spark-html.bat
echo   git-spark-html.bat --days 30 --heavy
echo   git-spark-html.bat --serve --port 8080
echo   git-spark-html.bat --branch main --author john@example.com
echo   git-spark-html.bat --since 2024-01-01 --path-pattern "**/*.ts"
echo.

:end