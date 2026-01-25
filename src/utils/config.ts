import { existsSync, readFileSync } from 'fs';
import { isAbsolute, resolve } from 'path';
import { GitSparkConfig, GitSparkOptions } from '../types/index.js';
import { createLogger } from './logger.js';

const logger = createLogger('config');

function normalizeExtensions(extensions?: string[]): string[] | undefined {
  if (!extensions || extensions.length === 0) {
    return undefined;
  }

  const normalized = extensions
    .map(ext => ext.trim())
    .filter(Boolean)
    .map(ext => (ext.startsWith('.') ? ext.toLowerCase() : `.${ext.toLowerCase()}`));

  return normalized.length > 0 ? Array.from(new Set(normalized)) : undefined;
}

function resolveConfigPath(configPath: string | undefined, repoPath: string): string | undefined {
  if (configPath) {
    return isAbsolute(configPath) ? configPath : resolve(repoPath, configPath);
  }

  const defaultPath = resolve(repoPath, '.git-spark.json');
  return existsSync(defaultPath) ? defaultPath : undefined;
}

export function resolveOptionsWithConfig(
  options: GitSparkOptions
): {
  options: GitSparkOptions;
  resolvedConfig?: Partial<GitSparkConfig>;
  configPath?: string;
} {
  const resolvedOptions: GitSparkOptions = { ...options };

  if (resolvedOptions.configResolved) {
    if (resolvedOptions.excludeExtensions) {
      const normalized = normalizeExtensions(resolvedOptions.excludeExtensions);
      if (normalized) {
        resolvedOptions.excludeExtensions = normalized;
      } else {
        delete resolvedOptions.excludeExtensions;
      }
    }
    return {
      options: resolvedOptions,
      ...(resolvedOptions.resolvedConfig ? { resolvedConfig: resolvedOptions.resolvedConfig } : {}),
      ...(resolvedOptions.config ? { configPath: resolvedOptions.config } : {}),
    };
  }

  const repoPath = resolvedOptions.repoPath || process.cwd();
  const configPath = resolveConfigPath(resolvedOptions.config, repoPath);

  let resolvedConfig: Partial<GitSparkConfig> | undefined;
  if (configPath && existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf8');
      resolvedConfig = JSON.parse(content) as Partial<GitSparkConfig>;
      logger.info('Loaded configuration file', { path: configPath });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load configuration file (${configPath}): ${message}`);
    }
  }

  if (resolvedConfig?.analysis?.excludeExtensions && !resolvedOptions.excludeExtensions) {
    const normalized = normalizeExtensions(resolvedConfig.analysis.excludeExtensions);
    if (normalized) {
      resolvedOptions.excludeExtensions = normalized;
    }
  }

  if (resolvedOptions.excludeExtensions) {
    const normalized = normalizeExtensions(resolvedOptions.excludeExtensions);
    if (normalized) {
      resolvedOptions.excludeExtensions = normalized;
    } else {
      delete resolvedOptions.excludeExtensions;
    }
  }

  if (resolvedConfig?.analysis?.timezone && !resolvedOptions.timezone) {
    resolvedOptions.timezone = resolvedConfig.analysis.timezone;
  }

  if (resolvedConfig?.output?.defaultFormat && !resolvedOptions.format) {
    resolvedOptions.format = resolvedConfig.output.defaultFormat;
  }

  if (resolvedConfig?.output?.outputDir && !resolvedOptions.output) {
    resolvedOptions.output = resolvedConfig.output.outputDir;
  }

  if (typeof resolvedConfig?.output?.redactEmails === 'boolean' && resolvedOptions.redactEmails === undefined) {
    resolvedOptions.redactEmails = resolvedConfig.output.redactEmails;
  }

  if (
    typeof resolvedConfig?.performance?.enableCaching === 'boolean' &&
    resolvedOptions.noCache === undefined
  ) {
    resolvedOptions.noCache = !resolvedConfig.performance.enableCaching;
  }

  if (configPath) {
    resolvedOptions.config = configPath;
  }

  if (resolvedConfig) {
    resolvedOptions.resolvedConfig = resolvedConfig;
  }
  resolvedOptions.configResolved = true;

  return {
    options: resolvedOptions,
    ...(resolvedConfig ? { resolvedConfig } : {}),
    ...(configPath ? { configPath } : {}),
  };
}
