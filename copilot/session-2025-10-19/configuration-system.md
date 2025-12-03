# Azure DevOps Configuration System Design

> **📋 DOCUMENT STATUS**: This is a historical design document from October 2025.  
> **✅ IMPLEMENTATION STATUS**: Configuration system has been **FULLY IMPLEMENTED**.  
> This document is retained for configuration design reference and user guidance.

## Overview

This document outlines the comprehensive configuration system for Azure DevOps integration in git-spark, supporting multiple configuration sources, auto-detection, and flexible deployment scenarios.

## Configuration Philosophy

### Design Principles

1. **Convention over Configuration**: Sensible defaults with minimal required setup
2. **Multiple Sources**: Support CLI, config files, environment variables, and auto-detection
3. **Priority Chain**: Clear precedence order for configuration resolution
4. **Validation**: Comprehensive validation with helpful error messages
5. **Security**: Secure handling of authentication credentials
6. **Flexibility**: Support enterprise, cloud, and hybrid scenarios

### Configuration Hierarchy

```
Priority Order (highest to lowest):
1. CLI Arguments
2. Environment Variables (AZURE_DEVOPS_*)
3. Configuration File (.git-spark.json)
4. Auto-Detection (Git remotes)
5. Interactive Prompts (TTY only)
6. Default Values
```

## Configuration Sources

### 1. CLI Arguments

#### Basic Usage

```bash
# Enable with auto-detection
git-spark --azure-devops

# Specify organization and project
git-spark --azure-devops --devops-org "myorg" --devops-project "myproject"

# Full configuration
git-spark --azure-devops \
  --devops-org "myorg" \
  --devops-project "myproject" \
  --devops-repo "myrepo" \
  --devops-auth "pat" \
  --devops-token-file "./token.txt"
```

#### CLI Option Mapping

```typescript
interface CLIOptions {
  azureDevops?: boolean;           // --azure-devops
  devopsOrg?: string;              // --devops-org
  devopsProject?: string;          // --devops-project
  devopsRepo?: string;             // --devops-repo
  devopsAuth?: string;             // --devops-auth
  devopsToken?: string;            // --devops-token
  devopsTokenFile?: string;        // --devops-token-file
}
```

### 2. Environment Variables

#### Standard Variables

```bash
# Core configuration
export AZURE_DEVOPS_ORG="myorganization"
export AZURE_DEVOPS_PROJECT="myproject"
export AZURE_DEVOPS_REPOSITORY="myrepo"

# Authentication
export AZURE_DEVOPS_AUTH_METHOD="pat"
export AZURE_DEVOPS_PAT="<personal-access-token>"
export AZURE_DEVOPS_PAT_FILE="/path/to/token.txt"

# Advanced configuration
export AZURE_DEVOPS_CACHE_TTL="3600"
export AZURE_DEVOPS_RATE_LIMIT_DELAY="1000"
export AZURE_DEVOPS_MAX_PRS="1000"
```

#### CI/CD Integration

```yaml
# GitHub Actions example
env:
  AZURE_DEVOPS_ORG: ${{ secrets.AZURE_DEVOPS_ORG }}
  AZURE_DEVOPS_PROJECT: ${{ vars.AZURE_DEVOPS_PROJECT }}
  AZURE_DEVOPS_PAT: ${{ secrets.AZURE_DEVOPS_PAT }}
```

### 3. Configuration File

#### .git-spark.json Schema

```json
{
  "version": "2.0",
  "azureDevOps": {
    "enabled": true,
    "organization": "myorganization",
    "project": "myproject",
    "repository": "auto-detect",
    "authentication": {
      "method": "pat",
      "tokenFile": "./secrets/azure-devops-pat.txt",
      "tokenEnvVar": "AZURE_DEVOPS_PAT"
    },
    "analysis": {
      "includePRData": true,
      "includeWorkItems": true,
      "maxPRs": 1000,
      "cacheTTL": 3600,
      "rateLimitDelay": 1000,
      "parallelRequests": 5
    },
    "filters": {
      "prStates": ["active", "completed"],
      "targetBranches": ["main", "develop"],
      "authors": [],
      "dateRange": {
        "since": "2024-01-01",
        "until": null
      }
    },
    "thresholds": {
      "stalePRDays": 7,
      "slowReviewHours": 24,
      "largeRequestLines": 500,
      "maxReviewCycles": 5
    },
    "output": {
      "includeInReports": true,
      "separateSection": true,
      "detailLevel": "full"
    }
  }
}
```

#### Configuration Schema Validation

```typescript
export const AzureDevOpsConfigSchema = {
  type: 'object',
  properties: {
    enabled: { type: 'boolean', default: false },
    organization: { type: 'string', minLength: 1 },
    project: { type: 'string', minLength: 1 },
    repository: { type: 'string', default: 'auto-detect' },
    authentication: {
      type: 'object',
      properties: {
        method: { 
          type: 'string', 
          enum: ['pat', 'cli', 'managed-identity'],
          default: 'pat'
        },
        tokenFile: { type: 'string' },
        tokenEnvVar: { type: 'string', default: 'AZURE_DEVOPS_PAT' }
      },
      required: ['method']
    },
    analysis: {
      type: 'object',
      properties: {
        includePRData: { type: 'boolean', default: true },
        includeWorkItems: { type: 'boolean', default: true },
        maxPRs: { type: 'number', minimum: 1, default: 1000 },
        cacheTTL: { type: 'number', minimum: 0, default: 3600 },
        rateLimitDelay: { type: 'number', minimum: 0, default: 1000 },
        parallelRequests: { type: 'number', minimum: 1, maximum: 10, default: 5 }
      }
    }
    // ... additional schema definitions
  },
  required: ['organization', 'project']
};
```

### 4. Auto-Detection

#### Git Remote Parsing

```typescript
export class GitRemoteDetector {
  static async detectAzureDevOps(repoPath: string): Promise<AzureDevOpsConfig | null> {
    const remotes = await this.getGitRemotes(repoPath);
    
    for (const remote of remotes) {
      const config = this.parseAzureDevOpsUrl(remote.url);
      if (config) {
        return {
          enabled: true,
          organization: config.organization,
          project: config.project,
          repository: config.repository,
          authentication: { method: 'pat' as const }
        };
      }
    }
    
    return null;
  }

  private static parseAzureDevOpsUrl(url: string): ParsedConfig | null {
    // Handle various Azure DevOps URL formats:
    // https://dev.azure.com/org/project/_git/repo
    // https://org.visualstudio.com/project/_git/repo
    // git@ssh.dev.azure.com:v3/org/project/repo
    // org@vs-ssh.visualstudio.com:v3/project/repo
    
    const patterns = [
      /https:\/\/dev\.azure\.com\/([^\/]+)\/([^\/]+)\/_git\/([^\/]+)/,
      /https:\/\/([^.]+)\.visualstudio\.com\/([^\/]+)\/_git\/([^\/]+)/,
      /git@ssh\.dev\.azure\.com:v3\/([^\/]+)\/([^\/]+)\/([^\/]+)/,
      /([^@]+)@vs-ssh\.visualstudio\.com:v3\/([^\/]+)\/([^\/]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return this.extractConfigFromMatch(match, pattern);
      }
    }

    return null;
  }
}
```

#### Repository Validation

```typescript
export class RepositoryValidator {
  static async validateRepository(
    config: AzureDevOpsConfig,
    repoPath: string
  ): Promise<ValidationResult> {
    try {
      // Check if Git repository matches Azure DevOps configuration
      const gitRemotes = await GitRemoteDetector.getGitRemotes(repoPath);
      const detectedConfig = await GitRemoteDetector.detectAzureDevOps(repoPath);
      
      if (detectedConfig) {
        const matches = this.configMatches(config, detectedConfig);
        if (!matches.isValid) {
          return {
            isValid: false,
            errors: [`Repository mismatch: ${matches.reason}`],
            warnings: []
          };
        }
      }

      // Validate API connectivity
      const apiClient = new AzureDevOpsApiClient(config);
      const connectionValid = await apiClient.validateConnection();
      
      if (!connectionValid) {
        return {
          isValid: false,
          errors: ['Cannot connect to Azure DevOps with provided configuration'],
          warnings: []
        };
      }

      return { isValid: true, errors: [], warnings: [] };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation failed: ${error.message}`],
        warnings: []
      };
    }
  }
}
```

## Configuration Resolution

### Resolution Algorithm

```typescript
export class ConfigurationResolver {
  static async resolve(
    options: GitSparkOptions,
    configFile?: GitSparkConfig,
    repoPath?: string
  ): Promise<ResolvedAzureDevOpsConfig | null> {
    
    // Step 1: Check if Azure DevOps is enabled
    if (!this.isAzureDevOpsEnabled(options, configFile)) {
      return null;
    }

    // Step 2: Start with defaults
    let config = this.getDefaultConfig();

    // Step 3: Apply auto-detection (lowest priority)
    if (repoPath) {
      const detected = await GitRemoteDetector.detectAzureDevOps(repoPath);
      if (detected) {
        config = this.mergeConfigs(config, detected);
      }
    }

    // Step 4: Apply configuration file
    if (configFile?.azureDevOps) {
      config = this.mergeConfigs(config, configFile.azureDevOps);
    }

    // Step 5: Apply environment variables
    const envConfig = this.getEnvironmentConfig();
    if (envConfig) {
      config = this.mergeConfigs(config, envConfig);
    }

    // Step 6: Apply CLI options (highest priority)
    const cliConfig = this.getCLIConfig(options);
    if (cliConfig) {
      config = this.mergeConfigs(config, cliConfig);
    }

    // Step 7: Validate and prompt if needed
    const validationResult = await this.validateConfig(config);
    if (!validationResult.isValid) {
      if (process.stdout.isTTY) {
        config = await this.promptForMissingConfig(config, validationResult);
      } else {
        throw new ValidationError(
          `Azure DevOps configuration is invalid: ${validationResult.errors.join(', ')}`
        );
      }
    }

    return config;
  }

  private static mergeConfigs(
    base: AzureDevOpsConfig,
    override: Partial<AzureDevOpsConfig>
  ): AzureDevOpsConfig {
    return {
      ...base,
      ...override,
      authentication: {
        ...base.authentication,
        ...override.authentication
      },
      analysis: {
        ...base.analysis,
        ...override.analysis
      },
      filters: {
        ...base.filters,
        ...override.filters
      },
      thresholds: {
        ...base.thresholds,
        ...override.thresholds
      }
    };
  }
}
```

### Interactive Configuration

```typescript
export class InteractiveConfigurator {
  static async promptForConfiguration(
    partialConfig: Partial<AzureDevOpsConfig>
  ): Promise<AzureDevOpsConfig> {
    
    const prompts = [
      {
        type: 'input',
        name: 'organization',
        message: 'Azure DevOps Organization:',
        default: partialConfig.organization,
        validate: (input: string) => input.length > 0 || 'Organization is required'
      },
      {
        type: 'input',
        name: 'project',
        message: 'Azure DevOps Project:',
        default: partialConfig.project,
        validate: (input: string) => input.length > 0 || 'Project is required'
      },
      {
        type: 'list',
        name: 'authMethod',
        message: 'Authentication Method:',
        choices: [
          { name: 'Personal Access Token (PAT)', value: 'pat' },
          { name: 'Azure CLI', value: 'cli' },
          { name: 'Managed Identity', value: 'managed-identity' }
        ],
        default: partialConfig.authentication?.method || 'pat'
      }
    ];

    const answers = await inquirer.prompt(prompts);
    
    // Additional prompts based on auth method
    if (answers.authMethod === 'pat') {
      const tokenPrompt = await inquirer.prompt([
        {
          type: 'password',
          name: 'token',
          message: 'Personal Access Token (leave empty to use environment variable):',
          mask: '*'
        }
      ]);
      
      if (tokenPrompt.token) {
        answers.token = tokenPrompt.token;
      }
    }

    return this.buildConfigFromAnswers(answers, partialConfig);
  }
}
```

## Authentication Configuration

### Personal Access Token (PAT)

```typescript
export class PATAuthenticator {
  static async configure(config: AzureDevOpsConfig): Promise<AuthConfig> {
    // Priority order for PAT:
    // 1. CLI option --devops-token
    // 2. Token file --devops-token-file
    // 3. Environment variable
    // 4. Interactive prompt

    let token: string | undefined;

    // Check token file
    if (config.authentication.tokenFile) {
      try {
        token = await fs.readFile(config.authentication.tokenFile, 'utf-8');
        token = token.trim();
      } catch (error) {
        throw new ConfigurationError(
          `Cannot read token file: ${config.authentication.tokenFile}`
        );
      }
    }

    // Check environment variable
    if (!token && config.authentication.tokenEnvVar) {
      token = process.env[config.authentication.tokenEnvVar];
    }

    // Interactive prompt as last resort
    if (!token && process.stdout.isTTY) {
      const answers = await inquirer.prompt([
        {
          type: 'password',
          name: 'token',
          message: 'Enter Azure DevOps Personal Access Token:',
          mask: '*',
          validate: (input: string) => input.length > 0 || 'Token is required'
        }
      ]);
      token = answers.token;
    }

    if (!token) {
      throw new ConfigurationError(
        'Azure DevOps Personal Access Token is required. ' +
        'Provide via --devops-token, --devops-token-file, or AZURE_DEVOPS_PAT environment variable.'
      );
    }

    return { method: 'pat', token };
  }
}
```

### Azure CLI Authentication

```typescript
export class CLIAuthenticator {
  static async configure(): Promise<AuthConfig> {
    try {
      // Check if Azure CLI is installed and logged in
      const result = await execAsync('az account show');
      const account = JSON.parse(result.stdout);
      
      if (!account) {
        throw new ConfigurationError('Not logged in to Azure CLI');
      }

      // Get access token for Azure DevOps
      const tokenResult = await execAsync(
        'az account get-access-token --resource 499b84ac-1321-427f-aa17-267ca6975798'
      );
      const tokenData = JSON.parse(tokenResult.stdout);

      return {
        method: 'cli',
        token: tokenData.accessToken,
        expiresOn: new Date(tokenData.expiresOn)
      };
    } catch (error) {
      throw new ConfigurationError(
        'Azure CLI authentication failed. ' +
        'Run "az login" to authenticate, or use PAT authentication instead.'
      );
    }
  }
}
```

## Configuration Validation

### Comprehensive Validation

```typescript
export class ConfigValidator {
  static async validate(config: AzureDevOpsConfig): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!config.organization) {
      errors.push('Azure DevOps organization is required');
    }

    if (!config.project) {
      errors.push('Azure DevOps project is required');
    }

    // Authentication validation
    try {
      await this.validateAuthentication(config);
    } catch (error) {
      errors.push(`Authentication validation failed: ${error.message}`);
    }

    // Network connectivity validation
    try {
      await this.validateConnectivity(config);
    } catch (error) {
      warnings.push(`Connectivity check failed: ${error.message}`);
    }

    // Permission validation
    try {
      await this.validatePermissions(config);
    } catch (error) {
      warnings.push(`Permission check failed: ${error.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private static async validateAuthentication(config: AzureDevOpsConfig): Promise<void> {
    const client = new AzureDevOpsApiClient(config);
    
    try {
      await client.validateConnection();
    } catch (error) {
      if (error.statusCode === 401) {
        throw new ConfigurationError('Invalid authentication credentials');
      } else if (error.statusCode === 403) {
        throw new ConfigurationError('Insufficient permissions');
      } else {
        throw new ConfigurationError(`Authentication failed: ${error.message}`);
      }
    }
  }

  private static async validateConnectivity(config: AzureDevOpsConfig): Promise<void> {
    const client = new AzureDevOpsApiClient(config);
    
    try {
      await client.getProjectInfo();
    } catch (error) {
      throw new ConfigurationError(`Cannot connect to project ${config.project}: ${error.message}`);
    }
  }
}
```

## Configuration Examples

### Enterprise Configuration

```json
{
  "azureDevOps": {
    "enabled": true,
    "organization": "contoso",
    "project": "ProductSuite",
    "repository": "auto-detect",
    "authentication": {
      "method": "managed-identity"
    },
    "analysis": {
      "maxPRs": 5000,
      "cacheTTL": 7200,
      "parallelRequests": 10
    },
    "filters": {
      "prStates": ["completed"],
      "targetBranches": ["main", "release/*"],
      "dateRange": {
        "since": "2024-01-01"
      }
    },
    "thresholds": {
      "stalePRDays": 3,
      "slowReviewHours": 12,
      "largeRequestLines": 1000
    }
  }
}
```

### CI/CD Configuration

```json
{
  "azureDevOps": {
    "enabled": true,
    "organization": "${AZURE_DEVOPS_ORG}",
    "project": "${AZURE_DEVOPS_PROJECT}",
    "authentication": {
      "method": "pat",
      "tokenEnvVar": "SYSTEM_ACCESSTOKEN"
    },
    "analysis": {
      "maxPRs": 1000,
      "cacheTTL": 1800
    },
    "output": {
      "includeInReports": true,
      "detailLevel": "summary"
    }
  }
}
```

### Development Configuration

```json
{
  "azureDevOps": {
    "enabled": true,
    "organization": "myorg",
    "project": "myproject",
    "authentication": {
      "method": "cli"
    },
    "analysis": {
      "maxPRs": 100,
      "cacheTTL": 300
    },
    "filters": {
      "prStates": ["active", "completed"],
      "authors": ["john.doe@company.com"]
    }
  }
}
```

This configuration system provides comprehensive support for various deployment scenarios while maintaining security, flexibility, and ease of use.
