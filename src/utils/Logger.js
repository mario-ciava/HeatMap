const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4
};

const LEVEL_COLORS = {
  debug: '#6b7280',
  info: '#3b82f6',
  warn: '#f59e0b',
  error: '#ef4444'
};

class Logger {
  constructor(config = {}) {
    this.level = LOG_LEVELS[config.level || 'warn'];
    this.prefix = config.prefix || '';
    this.enableTimestamp = config.enableTimestamp !== false;
    this.enableColors = config.enableColors !== false;
  }

  setLevel(level) {
    if (level in LOG_LEVELS) {
      this.level = LOG_LEVELS[level];
    }
  }

  _format(level, args) {
    const parts = [];

    if (this.enableTimestamp) {
      const now = new Date();
      const time = now.toTimeString().split(' ')[0];
      parts.push(time);
    }

    if (this.prefix) {
      parts.push(this.prefix);
    }

    const prefix = parts.length > 0 ? `[${parts.join(' ')}]` : '';

    if (this.enableColors && typeof window !== 'undefined') {
      const color = LEVEL_COLORS[level];
      return [`%c${prefix}`, `color: ${color}; font-weight: bold`, ...args];
    }

    return [prefix, ...args];
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

  child(childPrefix) {
    return new Logger({
      level: Object.keys(LOG_LEVELS).find(k => LOG_LEVELS[k] === this.level),
      prefix: this.prefix ? `${this.prefix}:${childPrefix}` : childPrefix,
      enableTimestamp: this.enableTimestamp,
      enableColors: this.enableColors
    });
  }
}

export const logger = new Logger({
  level: 'warn',
  enableTimestamp: true,
  enableColors: true
});

export { Logger };
