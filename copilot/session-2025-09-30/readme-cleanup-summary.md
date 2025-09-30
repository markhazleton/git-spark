# README.md Cleanup Summary

## Changes Made

### ✅ Removed Unimplemented Features

- **Watch mode (`--watch`)**: CLI option existed but no core implementation
- **Branch comparison (`--compare`)**: CLI option existed but no core implementation
- Moved both features to v1.1 roadmap with proper annotations

### ✅ Updated Documentation Accuracy

- Added implementation status note in Features section
- Clarified that temporal coupling is planned for v1.1, not current
- Updated configuration section to note current implementation status
- Fixed CONTRIBUTING.md reference (file doesn't exist)
- Removed misleading "coupling" annotation from --heavy option

### ✅ Maintained Implemented Features

- All output formats (HTML, JSON, CSV, Markdown, Console) - ✅ Verified
- Health and validate commands - ✅ Verified  
- Email redaction functionality - ✅ Present in code
- Heavy analysis mode - ✅ Present (basic implementation)
- Progressive reporting and security features - ✅ Verified in HTML exporter

### ✅ Roadmap Updates

- Moved unimplemented CLI features to v1.1 with clear annotations
- Reorganized feature progression across versions
- API server mode moved from v1.1 to v1.2

## Verification Status

### Core Features (v1.0) - All Implemented ✅

- Repository health scoring
- Team collaboration analysis  
- Risk assessment and governance scoring
- Timeline visualization
- Bus factor calculation
- Multiple output formats
- CLI interface with progress indicators
- Programmatic API
- Interactive HTML reports
- Security features (CSP, SRI, input validation)
- Email redaction
- Basic configuration support

### Roadmap Features - Properly Categorized ✅

- v1.1: Branch comparison, watch mode, advanced temporal coupling
- v1.2: API server mode, ML-based detection
- v2.0: Web dashboard, database persistence

## Result

README.md now accurately reflects only implemented features for v1.0, with unimplemented features properly categorized in the roadmap with clear version targets.
