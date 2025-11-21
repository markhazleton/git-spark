import { AzureDevOpsConfig, AzureDevOpsValidationResult, GitSparkOptions } from '../../types/index.js';
import { createLogger } from '../../utils/logger.js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const logger = createLogger('azure-devops-config');

/**
 * Default Azure DevOps configuration
 */
export const DEFAULT_AZURE_DEVOPS_CONFIG: Partial<AzureDevOpsConfig> = {
  cache: {
    enabled: true,
    directory: '.git-spark/cache/azure-devops',
    ttlMs: 60 * 60 * 1000, // 1 hour
    incremental: true,
    maxSizeMB: 100,
    backgroundWarmup: false,
  },
  api: {
    baseUrl: 'https://dev.azure.com',
    version: '7.0',
    timeoutMs: 30000,
    maxRetries: 3,
    rateLimit: {
      requestsPerMinute: 180,
      enabled: true,
    },
    pagination: {
      pageSize: 100,
      maxPageSize: 1000,
      enableTimePartitioning: true,
    },
  },
  filters: {
    pullRequestStates: ['completed', 'active'],
    excludeAutomated: false,
  },
  integration: {
    enablePullRequests: true,
    enableWorkItems: false,
    enableReviewers: true,
    enableBuilds: false,
    mergeCommitIntegration: true,
    progressReporting: true,
  },
};

/**
 * Resolve Azure DevOps configuration from multiple sources
 */
export class AzureDevOpsConfigResolver {
  constructor(
    private repoPath: string,
    private options: GitSparkOptions
  ) {}

  /**
   * Resolve complete Azure DevOps configuration
   */
  async resolveConfig(): Promise<AzureDevOpsConfig | null> {
    try {
      // Check if Azure DevOps integration is enabled
      if (!this.options.azureDevOps) {
        return null;
      }

      logger.info('Resolving Azure DevOps configuration');

      // Start with default configuration
      let config: Partial<AzureDevOpsConfig> = { ...DEFAULT_AZURE_DEVOPS_CONFIG };

      // Load from configuration file
      const fileConfig = await this.loadFromConfigFile();
      if (fileConfig) {
        config = this.mergeConfigs(config, fileConfig);
      }

      // Load from environment variables
      const envConfig = this.loadFromEnvironment();
      if (envConfig) {
        config = this.mergeConfigs(config, envConfig);
      }

      // Auto-detect from Git remote (provides base settings)
      const autoDetectedConfig = await this.autoDetectFromGitRemote();
      if (autoDetectedConfig) {
        config = this.mergeConfigs(config, autoDetectedConfig);
      }

      // Apply config file settings (preserve auto-detected baseUrl if not explicitly set)
      if (fileConfig) {
        config = this.mergeConfigsPreservingBaseUrl(config, fileConfig, autoDetectedConfig);
      }

      // Re-apply environment variables (higher priority)
      if (envConfig) {
        config = this.mergeConfigs(config, envConfig);
      }

      // Apply CLI options (highest priority)
      const cliConfig = this.loadFromCLIOptions();
      if (cliConfig) {
        config = this.mergeConfigs(config, cliConfig);
      }

      // Validate required fields
      const validationResult = this.validateConfig(config as AzureDevOpsConfig);
      if (!validationResult.isValid) {
        throw new Error(
          `Azure DevOps configuration validation failed: ${validationResult.errors.join(', ')}`
        );
      }

      logger.info('Azure DevOps configuration resolved successfully', {
        organization: config.organization,
        project: config.project,
        repository: config.repository,
        hasToken: !!config.personalAccessToken,
      });

      return config as AzureDevOpsConfig;
    } catch (error) {
      logger.error('Failed to resolve Azure DevOps configuration', { error });
      throw error;
    }
  }

  /**
   * Load configuration from file
   */
  private async loadFromConfigFile(): Promise<Partial<AzureDevOpsConfig> | null> {
    try {
      // Check for specific Azure DevOps config file first
      if (this.options.devopsConfig) {
        const configPath = resolve(this.repoPath, this.options.devopsConfig);
        if (existsSync(configPath)) {
          const configContent = readFileSync(configPath, 'utf-8');
          const config = JSON.parse(configContent) as AzureDevOpsConfig;
          logger.debug('Loaded Azure DevOps config from specific file', { path: configPath });
          return config;
        } else {
          logger.warn('Specified Azure DevOps config file not found', { path: configPath });
        }
      }

      // Check for Azure DevOps section in main git-spark config
      const mainConfigPath = resolve(this.repoPath, '.git-spark.json');
      if (existsSync(mainConfigPath)) {
        const mainConfig = JSON.parse(readFileSync(mainConfigPath, 'utf-8'));
        if (mainConfig.azureDevOps) {
          logger.debug('Loaded Azure DevOps config from main config file');
          return mainConfig.azureDevOps as Partial<AzureDevOpsConfig>;
        }
      }

      // Check for dedicated azure-devops.json file
      const azureConfigPath = resolve(this.repoPath, '.azure-devops.json');
      if (existsSync(azureConfigPath)) {
        const configContent = readFileSync(azureConfigPath, 'utf-8');
        const config = JSON.parse(configContent) as AzureDevOpsConfig;
        logger.debug('Loaded Azure DevOps config from dedicated file');
        return config;
      }

      return null;
    } catch (error) {
      logger.warn('Failed to load Azure DevOps config from file', { error });
      return null;
    }
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnvironment(): Partial<AzureDevOpsConfig> | null {
    const envConfig: Partial<AzureDevOpsConfig> = {};
    let hasEnvConfig = false;

    // Azure DevOps organization
    if (process.env.AZURE_DEVOPS_ORG || process.env.AZURE_DEVOPS_ORGANIZATION) {
      envConfig.organization =
        process.env.AZURE_DEVOPS_ORG || process.env.AZURE_DEVOPS_ORGANIZATION!;
      hasEnvConfig = true;
    }

    // Azure DevOps project
    if (process.env.AZURE_DEVOPS_PROJECT) {
      envConfig.project = process.env.AZURE_DEVOPS_PROJECT;
      hasEnvConfig = true;
    }

    // Personal Access Token
    if (process.env.AZURE_DEVOPS_PAT || process.env.AZURE_DEVOPS_TOKEN) {
      envConfig.personalAccessToken =
        process.env.AZURE_DEVOPS_PAT || process.env.AZURE_DEVOPS_TOKEN!;
      hasEnvConfig = true;
    }

    // Repository name
    if (process.env.AZURE_DEVOPS_REPO || process.env.AZURE_DEVOPS_REPOSITORY) {
      envConfig.repository = process.env.AZURE_DEVOPS_REPO || process.env.AZURE_DEVOPS_REPOSITORY!;
      hasEnvConfig = true;
    }

    if (hasEnvConfig) {
      logger.debug('Loaded Azure DevOps config from environment variables');
      return envConfig;
    }

    return null;
  }

  /**
   * Load configuration from CLI options
   */
  private loadFromCLIOptions(): Partial<AzureDevOpsConfig> | null {
    const cliConfig: Partial<AzureDevOpsConfig> = {};
    let hasCliConfig = false;

    if (this.options.devopsOrg) {
      cliConfig.organization = this.options.devopsOrg;
      hasCliConfig = true;
    }

    if (this.options.devopsProject) {
      cliConfig.project = this.options.devopsProject;
      hasCliConfig = true;
    }

    if (this.options.devopsRepo) {
      cliConfig.repository = this.options.devopsRepo;
      hasCliConfig = true;
    }

    if (this.options.devopsPat) {
      cliConfig.personalAccessToken = this.options.devopsPat;
      hasCliConfig = true;
    }

    if (hasCliConfig) {
      logger.debug('Loaded Azure DevOps config from CLI options');
      return cliConfig;
    }

    return null;
  }

  /**
   * Auto-detect configuration from Git remote URL
   */
  private async autoDetectFromGitRemote(): Promise<Partial<AzureDevOpsConfig> | null> {
    try {
      const { GitExecutor } = await import('../../utils/git');
      const git = new GitExecutor(this.repoPath);

      const remoteUrl = await git.getRemoteUrl();
      if (!remoteUrl) {
        return null;
      }

      // Parse Azure DevOps URL patterns
      // Examples:
      // https://dev.azure.com/org/project/_git/repo
      // https://org.visualstudio.com/project/_git/repo
      // git@ssh.dev.azure.com:v3/org/project/repo

      const azureDevOpsPatterns = [
        /https:\/\/dev\.azure\.com\/([^\/]+)\/([^\/]+)\/_git\/([^\/]+)/,
        /https:\/\/([^\.]+)\.visualstudio\.com\/([^\/]+)\/_git\/([^\/]+)/,
        /git@ssh\.dev\.azure\.com:v3\/([^\/]+)\/([^\/]+)\/([^\/]+)/,
      ];

      for (const pattern of azureDevOpsPatterns) {
        const match = remoteUrl.match(pattern);
        if (match) {
          const [, organization, project, repository] = match;

          // Determine the correct base URL format based on the detected pattern
          let baseUrl: string;
          if (remoteUrl.includes('.visualstudio.com')) {
            baseUrl = `https://${organization}.visualstudio.com`;
          } else {
            baseUrl = 'https://dev.azure.com';
          }

          logger.info('Auto-detected Azure DevOps configuration from Git remote', {
            organization,
            project,
            repository,
            baseUrl,
            remoteUrl: remoteUrl.replace(/\/\/[^@]*@/, '//***@'), // Redact credentials
          });

          return {
            organization,
            project,
            repository,
            api: {
              ...DEFAULT_AZURE_DEVOPS_CONFIG.api!,
              baseUrl,
            },
          };
        }
      }

      return null;
    } catch (error) {
      logger.debug('Failed to auto-detect Azure DevOps config from Git remote', { error });
      return null;
    }
  }

  /**
   * Merge configuration objects with deep merge for nested objects
   */
  private mergeConfigs(
    base: Partial<AzureDevOpsConfig>,
    override: Partial<AzureDevOpsConfig>
  ): Partial<AzureDevOpsConfig> {
    const result = { ...base };

    // Handle top-level properties
    Object.keys(override).forEach(key => {
      const typedKey = key as keyof AzureDevOpsConfig;

      if (override[typedKey] !== undefined && override[typedKey] !== null) {
        if (typeof override[typedKey] === 'object' && !Array.isArray(override[typedKey])) {
          // Deep merge for nested objects
          result[typedKey] = {
            ...(result[typedKey] as any),
            ...(override[typedKey] as any),
          };
        } else {
          // Direct assignment for primitives and arrays
          result[typedKey] = override[typedKey] as any;
        }
      }
    });

    return result;
  }

  /**
   * Merge configuration objects while preserving explicit config settings over auto-detection
   */
  private mergeConfigsPreservingBaseUrl(
    base: Partial<AzureDevOpsConfig>,
    override: Partial<AzureDevOpsConfig>,
    autoDetected?: Partial<AzureDevOpsConfig> | null
  ): Partial<AzureDevOpsConfig> {
    const result = this.mergeConfigs(base, override);

    // Only use auto-detected baseUrl if config file doesn't explicitly provide one
    if (autoDetected?.api?.baseUrl && !override.api?.baseUrl) {
      // Ensure api object exists
      if (!result.api) {
        result.api = { ...DEFAULT_AZURE_DEVOPS_CONFIG.api! };
      }

      // Use the auto-detected baseUrl only when not explicitly set
      result.api.baseUrl = autoDetected.api.baseUrl;

      logger.debug('Using auto-detected baseUrl from Git remote', {
        baseUrl: autoDetected.api.baseUrl,
        reason: 'config file does not specify baseUrl',
      });
    } else if (override.api?.baseUrl) {
      logger.debug('Using explicit baseUrl from config file', {
        baseUrl: override.api.baseUrl,
        autoDetectedUrl: autoDetected?.api?.baseUrl || 'none',
      });
    }

    return result;
  }

  /**
   * Validate Azure DevOps configuration
   */
  private validateConfig(config: AzureDevOpsConfig): AzureDevOpsValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!config.organization) {
      errors.push('Azure DevOps organization is required');
    }

    if (!config.project) {
      errors.push('Azure DevOps project is required');
    }

    // Validate organization name format
    if (config.organization && !/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/.test(config.organization)) {
      errors.push('Azure DevOps organization name contains invalid characters');
    }

    // Check for Personal Access Token
    if (!config.personalAccessToken) {
      warnings.push('No Personal Access Token provided - will attempt to use default credentials');
    }

    // Validate API configuration
    if (config.api) {
      if (config.api.timeoutMs && config.api.timeoutMs < 1000) {
        warnings.push('API timeout is very low (< 1 second)');
      }

      if (config.api.pagination?.pageSize && config.api.pagination.pageSize > 1000) {
        errors.push('Page size cannot exceed 1000 (Azure DevOps API limit)');
      }
    }

    // Validate cache configuration
    if (config.cache) {
      if (config.cache.maxSizeMB && config.cache.maxSizeMB < 1) {
        warnings.push('Cache size is very small (< 1MB)');
      }

      if (config.cache.ttlMs && config.cache.ttlMs < 60000) {
        warnings.push('Cache TTL is very short (< 1 minute)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      configValidation: {
        organizationValid: !!config.organization,
        projectValid: !!config.project,
        tokenValid: !!config.personalAccessToken,
        repositoryValid: !!config.repository,
      },
    };
  }
}

/**
 * Create and validate Azure DevOps configuration
 */
export async function createAzureDevOpsConfig(
  repoPath: string,
  options: GitSparkOptions
): Promise<AzureDevOpsConfig | null> {
  const resolver = new AzureDevOpsConfigResolver(repoPath, options);
  return resolver.resolveConfig();
}

/**
 * Generate example Azure DevOps configuration file
 */
export function generateExampleConfig(): AzureDevOpsConfig {
  return {
    organization: 'your-org',
    project: 'your-project',
    repository: 'your-repo',
    personalAccessToken: 'your-pat-token',
    ...DEFAULT_AZURE_DEVOPS_CONFIG,
  } as AzureDevOpsConfig;
}

/**
 * Validate Azure DevOps configuration without resolving
 */
export function validateAzureDevOpsConfig(
  config: Partial<AzureDevOpsConfig>
): AzureDevOpsValidationResult {
  const resolver = new AzureDevOpsConfigResolver('', {});
  return (resolver as any).validateConfig(config);
}
