/**
 * Worker Configuration
 * Centralizes all Worker settings and environment variable parsing
 *
 * === CONFIGURATION GUIDE ===
 *
 * Required Environment Variables:
 * - FINNHUB_API_KEY (Secret): Your Finnhub API key
 * - ALLOWED_ORIGINS (Var): Comma-separated origins (see below)
 *
 * ALLOWED_ORIGINS Examples:
 * - Development: "http://localhost,http://127.0.0.1"
 * - Production: "https://yourdomain.com,https://www.yourdomain.com"
 * - Mixed: "http://localhost,https://yourdomain.com"
 *
 * SECURITY NOTES:
 * - Wildcards (*) are NOT allowed for security
 * - Origins are normalized (lowercased, trimmed)
 * - Only http:// and https:// schemes accepted
 * - localhost and 127.0.0.1 are valid for development
 * - Add your future domain here when ready!
 */

export const DEFAULTS = {
  // Finnhub API endpoints
  REST_BASE: "https://finnhub.io/api/v1",
  WS_BASE: "https://ws.finnhub.io",

  // Rate limiting (global)
  RATE_LIMIT_REQUESTS: 50, // Requests per window
  RATE_LIMIT_WINDOW_MS: 60000, // 1 minute window

  // WebSocket-specific limits
  WS_KEEPALIVE_MS: 25000, // 25 seconds between pings
  WS_PONG_TIMEOUT_MS: 60000, // 60 seconds without pong = timeout
  WS_MAX_SUBSCRIPTIONS: 50, // Max symbols per connection
  WS_MAX_MESSAGES_PER_MINUTE: 60, // Max messages per connection per minute

  // REST endpoint security (allowed paths)
  ALLOWED_REST_PATHS: ['/quote', '/stock/market-status'],
};

/**
 * Validate and normalize a single origin
 * @param {string} origin - Origin to validate
 * @returns {string|null} Normalized origin or null if invalid
 */
function validateAndNormalizeOrigin(origin) {
  if (!origin || typeof origin !== 'string') {
    return null;
  }

  // Trim and lowercase
  const normalized = origin.trim().toLowerCase();

  // SECURITY: Reject wildcards
  if (normalized === '*' || normalized.includes('*')) {
    console.error(`[CONFIG] Rejected wildcard origin: ${origin}`);
    return null;
  }

  // SECURITY: Reject 'null' origin
  if (normalized === 'null') {
    console.error(`[CONFIG] Rejected null origin`);
    return null;
  }

  // SECURITY: Must start with http:// or https://
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    console.error(`[CONFIG] Invalid scheme for origin: ${origin} (must be http:// or https://)`);
    return null;
  }

  // Parse URL to validate format
  try {
    const url = new URL(normalized);

    // Reconstruct normalized origin (scheme + host + port if non-default)
    let validOrigin = `${url.protocol}//${url.hostname}`;

    // Add port if non-default
    const defaultPort = url.protocol === 'https:' ? '443' : '80';
    if (url.port && url.port !== defaultPort) {
      validOrigin += `:${url.port}`;
    }

    return validOrigin;
  } catch (error) {
    console.error(`[CONFIG] Malformed origin URL: ${origin}`, error.message);
    return null;
  }
}

export class WorkerConfig {
  constructor(env) {
    this.env = env;

    // API Key (required)
    this.apiKey = env.FINNHUB_API_KEY;
    if (!this.apiKey) {
      throw new Error("FINNHUB_API_KEY not configured");
    }

    // REST & WebSocket endpoints
    this.restBase = (env.FINNHUB_REST_BASE || DEFAULTS.REST_BASE).replace(/\/+$/, "");
    this.wsBase = (env.FINNHUB_WS || DEFAULTS.WS_BASE).replace(/\/+$/, "");

    // CORS allowed origins (CSV) with validation and normalization
    const raw = (env.ALLOWED_ORIGINS || "").trim();
    const rawOrigins = raw ? raw.split(",").map(s => s.trim()).filter(Boolean) : [];

    // Validate and normalize each origin
    this.allowedOrigins = rawOrigins
      .map(validateAndNormalizeOrigin)
      .filter(Boolean); // Remove nulls

    if (rawOrigins.length > 0 && this.allowedOrigins.length === 0) {
      console.error(`[CONFIG] All origins were rejected. Check ALLOWED_ORIGINS format.`);
    }

    // Rate limiting (global)
    this.rateLimitRequests = parseInt(env.RATE_LIMIT_REQUESTS || DEFAULTS.RATE_LIMIT_REQUESTS);
    this.rateLimitWindowMs = parseInt(env.RATE_LIMIT_WINDOW_MS || DEFAULTS.RATE_LIMIT_WINDOW_MS);

    // WebSocket settings
    this.wsKeepAliveMs = parseInt(env.WS_KEEPALIVE_MS || DEFAULTS.WS_KEEPALIVE_MS);
    this.wsPongTimeoutMs = parseInt(env.WS_PONG_TIMEOUT_MS || DEFAULTS.WS_PONG_TIMEOUT_MS);
    this.wsMaxSubscriptions = parseInt(env.WS_MAX_SUBSCRIPTIONS || DEFAULTS.WS_MAX_SUBSCRIPTIONS);
    this.wsMaxMessagesPerMinute = parseInt(env.WS_MAX_MESSAGES_PER_MINUTE || DEFAULTS.WS_MAX_MESSAGES_PER_MINUTE);

    // REST allowed paths (security: only expose necessary endpoints)
    const customPaths = env.ALLOWED_REST_PATHS;
    this.allowedRestPaths = customPaths
      ? new Set(customPaths.split(',').map(p => p.trim()).filter(Boolean))
      : new Set(DEFAULTS.ALLOWED_REST_PATHS);
  }

  /**
   * Validate required configuration
   * @returns {{valid: boolean, error?: string}} Validation result
   */
  validate() {
    if (!this.apiKey) {
      return {
        valid: false,
        error: "Missing FINNHUB_API_KEY",
        hint: "Set FINNHUB_API_KEY in Worker environment variables"
      };
    }

    if (this.allowedOrigins.length === 0) {
      return {
        valid: false,
        error: "No valid origins configured",
        hint: "Set ALLOWED_ORIGINS (e.g., 'http://localhost,https://yourdomain.com')"
      };
    }

    if (this.allowedRestPaths.size === 0) {
      return {
        valid: false,
        error: "No REST paths configured",
        hint: "At least one REST endpoint path must be allowed"
      };
    }

    return { valid: true };
  }

  /**
   * Get configuration summary for logging (without sensitive data)
   * @returns {Object}
   */
  getSummary() {
    return {
      allowedOrigins: this.allowedOrigins,
      allowedRestPaths: Array.from(this.allowedRestPaths),
      rateLimitRequests: this.rateLimitRequests,
      rateLimitWindowMs: this.rateLimitWindowMs,
      wsMaxSubscriptions: this.wsMaxSubscriptions,
      wsMaxMessagesPerMinute: this.wsMaxMessagesPerMinute,
      apiKeyConfigured: !!this.apiKey,
    };
  }
}
