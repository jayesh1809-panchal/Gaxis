/**
 * Internal Logger Service
 * Can be disabled or redirected via config to avoid spamming the host application.
 */
class LoggerService {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.level = options.level || 'info';
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
  }
  _shouldLog(level) {
    if (!this.enabled) return false;
    return this.levels[level] >= this.levels[this.level];
  }
  debug(message, ...meta) {
    if (this._shouldLog('debug')) console.debug(`[GAxis:DEBUG] ${message}`, ...meta);
  }
  info(message, ...meta) {
    if (this._shouldLog('info')) console.info(`[GAxis:INFO] ${message}`, ...meta);
  }
  warn(message, ...meta) {
    if (this._shouldLog('warn')) console.warn(`[GAxis:WARN] ${message}`, ...meta);
  }
  error(message, ...meta) {
    if (this._shouldLog('error')) console.error(`[GAxis:ERROR] ${message}`, ...meta);
  }
}
module.exports = LoggerService;