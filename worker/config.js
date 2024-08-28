/**
 * Worker Configuration
 * Centralizes all Worker settings and environment variable parsing
 */

export const DEFAULTS = {
  REST_BASE: "https://finnhub.io/api/v1",
  WS_BASE: "https://ws.finnhub.io",
  RATE_LIMIT_REQUESTS: 50, // Requests per window
  RATE_LIMIT_WINDOW_MS: 60000, // 1 minute window
  WS_KEEPALIVE_MS: 25000, // 25 seconds
  WS_PONG_TIMEOUT_MS: 60000, // 60 seconds without pong = timeout
};

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

    // CORS allowed origins (CSV)
    const raw = (env.ALLOWED_ORIGINS || "").trim();
    this.allowedOrigins = raw ? raw.split(",").map(s => s.trim()).filter(Boolean) : [];

    // Rate limiting
    this.rateLimitRequests = parseInt(env.RATE_LIMIT_REQUESTS || DEFAULTS.RATE_LIMIT_REQUESTS);
    this.rateLimitWindowMs = parseInt(env.RATE_LIMIT_WINDOW_MS || DEFAULTS.RATE_LIMIT_WINDOW_MS);

    // WebSocket settings
    this.wsKeepAliveMs = parseInt(env.WS_KEEPALIVE_MS || DEFAULTS.WS_KEEPALIVE_MS);
    this.wsPongTimeoutMs = parseInt(env.WS_PONG_TIMEOUT_MS || DEFAULTS.WS_PONG_TIMEOUT_MS);
  }

  /**
   * Validate required configuration
   */
  validate() {
    if (!this.apiKey) {
      return { valid: false, error: "Missing FINNHUB_API_KEY" };
    }
    if (this.allowedOrigins.length === 0) {
      return { valid: false, error: "ALLOWED_ORIGINS not configured - security risk!" };
    }
    return { valid: true };
  }
}
