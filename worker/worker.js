/**
 * Finnhub Proxy Worker
 * Cloudflare Worker that securely proxies REST and WebSocket requests to Finnhub
 *
 * Architecture:
 * - Modular design with separate handlers for CORS, rate limiting, REST, and WebSocket
 * - Server-side API key management (never exposed to client)
 * - Rate limiting per IP address (50 req/min default)
 * - CORS protection with strict origin validation
 * - WebSocket keep-alive and health checks
 *
 * Environment Variables (Settings → Variables):
 * - FINNHUB_API_KEY (Secret): Your Finnhub API key
 * - ALLOWED_ORIGINS (Var): Comma-separated list of allowed origins
 * - FINNHUB_REST_BASE (Var, Optional): Override REST endpoint
 * - FINNHUB_WS (Var, Optional): Override WebSocket endpoint (use https://)
 * - RATE_LIMIT_REQUESTS (Var, Optional): Max requests per window (default: 50)
 * - RATE_LIMIT_WINDOW_MS (Var, Optional): Rate limit window in ms (default: 60000)
 */

import { WorkerConfig } from './config.js';
import { handleOptions } from './cors.js';
import { handleREST } from './rest-handler.js';
import { handleWebSocket } from './ws-handler.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Initialize configuration
    let config;
    try {
      config = new WorkerConfig(env);

      // Validate configuration
      const validation = config.validate();
      if (!validation.valid) {
        // SECURITY: Log detailed error server-side, show generic message to client
        console.error("[WORKER] Configuration validation failed:", {
          error: validation.error,
          hint: validation.hint
        });

        return new Response(JSON.stringify({
          error: "Service temporarily unavailable",
          message: "Server configuration issue - please contact administrator"
        }), {
          status: 503,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Log successful initialization (without sensitive data)
      console.log("[WORKER] Initialized successfully:", config.getSummary());

    } catch (error) {
      // SECURITY: Log detailed error server-side, show generic message to client
      console.error("[WORKER] Initialization exception:", error);

      return new Response(JSON.stringify({
        error: "Service temporarily unavailable",
        message: "Server initialization failed - please contact administrator"
      }), {
        status: 503,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Route requests
    try {
      // OPTIONS preflight
      if (request.method === "OPTIONS") {
        return handleOptions(request, config.allowedOrigins);
      }

      // REST API proxy
      if (url.pathname.startsWith("/api/")) {
        return await handleREST(request, config);
      }

      // WebSocket proxy
      if (url.pathname === "/ws") {
        return await handleWebSocket(request, config, ctx);
      }

      // 404 for unknown paths
      return new Response(JSON.stringify({
        error: "Not found",
        availableEndpoints: ["/api/*", "/ws"]
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });

    } catch (error) {
      console.error("Request handler error:", error);
      return new Response(JSON.stringify({
        error: "Internal server error"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};
