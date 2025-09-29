import { LogLevel } from '../types';

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  module: string;
  message: string;
  metadata?: any;
}

class Logger {
  private level: LogLevel = 'info';
  private module: string;

  constructor(module: string) {
    this.module = module;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  error(message: string, metadata?: any): void {
    this.log('error', message, metadata);
  }

  warn(message: string, metadata?: any): void {
    this.log('warn', message, metadata);
  }

  info(message: string, metadata?: any): void {
    this.log('info', message, metadata);
  }

  debug(message: string, metadata?: any): void {
    this.log('debug', message, metadata);
  }

  verbose(message: string, metadata?: any): void {
    this.log('verbose', message, metadata);
  }

  private log(level: LogLevel, message: string, metadata?: any): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      module: this.module,
      message,
      metadata,
    };

    this.output(entry);
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ['error', 'warn', 'info', 'debug', 'verbose'];
    const currentIndex = levels.indexOf(this.level);
    const messageIndex = levels.indexOf(level);
    return messageIndex <= currentIndex;
  }

  private output(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const levelStr = entry.level.toUpperCase().padEnd(7);
    const moduleStr = entry.module.padEnd(12);

    let output = `${timestamp} ${levelStr} [${moduleStr}] ${entry.message}`;

    if (entry.metadata) {
      output += ` ${JSON.stringify(entry.metadata)}`;
    }

    switch (entry.level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      default:
        console.log(output);
        break;
    }
  }
}

const loggers = new Map<string, Logger>();

export function createLogger(module: string): Logger {
  if (!loggers.has(module)) {
    loggers.set(module, new Logger(module));
  }
  return loggers.get(module)!;
}

export function setGlobalLogLevel(level: LogLevel): void {
  for (const logger of loggers.values()) {
    logger.setLevel(level);
  }
}
