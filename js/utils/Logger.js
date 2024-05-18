/**
 * Logger - Configurable logging utility
 * Supports log levels and formatted output
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4
};

class Logger {
  constructor(config = {}) {
    this.level = LOG_LEVELS[config.level || 'info'];
    this.prefix = config.prefix || '';
  }

  /**
   * Set log level
   * @param {'debug' | 'info' | 'warn' | 'error' | 'none'} level
   */
  setLevel(level) {
    if (level in LOG_LEVELS) {
      this.level = LOG_LEVELS[level];
    }
  }

  /**
   * Format message with timestamp and prefix
   */
  _format(level, args) {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
    const prefix = this.prefix ? `[${this.prefix}]` : '';
    return [`[${timestamp}]${prefix}[${level.toUpperCase()}]`, ...args];
  }

  debug(...args) {
    if (this.level <= LOG_LEVELS.debug) {
      console.log(...this._format('debug', args));
    }
  }

  info(...args) {
    if (this.level <= LOG_LEVELS.info) {
      console.info(...this._format('info', args));
    }
  }

  warn(...args) {
    if (this.level <= LOG_LEVELS.warn) {
      console.warn(...this._format('warn', args));
    }
  }

  error(...args) {
    if (this.level <= LOG_LEVELS.error) {
      console.error(...this._format('error', args));
    }
  }

  /**
   * Create a child logger with additional prefix
   * @param {string} childPrefix
   * @returns {Logger}
   */
  child(childPrefix) {
    return new Logger({
      level: Object.keys(LOG_LEVELS).find(k => LOG_LEVELS[k] === this.level),
      prefix: this.prefix ? `${this.prefix}:${childPrefix}` : childPrefix
    });
  }
}

// Export singleton with default config
export const logger = new Logger({ level: 'info' });

// Export class for creating custom loggers
export { Logger };
