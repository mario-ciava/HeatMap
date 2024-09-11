/**
 * WebSocket Handler
 * Bidirectional WebSocket proxy with keep-alive and rate limiting
 *
 * SECURITY:
 * - Message validation: only subscribe/unsubscribe with valid symbol format
 * - Subscription limit: max symbols per connection (prevents abuse)
 * - Message rate limit: max messages per minute per connection
 * - Connection rate limit: max connections per IP
 * - No fallback to origin for IP identification
 */

import { isAllowedOrigin } from './cors.js';
import { checkRateLimit } from './rate-limit.js';

/**
 * Validate ticker symbol format
 * Allows: uppercase letters, dots, dashes (1-10 chars)
 * Examples: AAPL, BRK.B, BTC-USD
 * @param {string} symbol
 * @returns {boolean}
 */
function isValidSymbol(symbol) {
  if (typeof symbol !== 'string') return false;
  // Allow uppercase letters, dots, dashes, 1-10 characters
  return /^[A-Z.\-]{1,10}$/.test(symbol);
}

/**
 * Validate and sanitize WebSocket message from client
 * @param {string} data - Raw message data
 * @returns {{valid: boolean, type?: string, symbol?: string, reason?: string}}
 */
function validateMessage(data) {
  // Parse JSON
  let msg;
  try {
    msg = JSON.parse(data);
  } catch (error) {
    return { valid: false, reason: 'Invalid JSON' };
  }

  // Must be an object
  if (!msg || typeof msg !== 'object') {
    return { valid: false, reason: 'Message must be object' };
  }

  const { type, symbol } = msg;

  // Type must be subscribe or unsubscribe
  if (type !== 'subscribe' && type !== 'unsubscribe') {
    // Allow pong responses (for heartbeat)
    if (type === 'pong') {
      return { valid: true, type: 'pong' };
    }
    return { valid: false, reason: 'Invalid type (allowed: subscribe, unsubscribe)' };
  }

  // Symbol must be present and valid
  if (!symbol || !isValidSymbol(symbol)) {
    return { valid: false, reason: 'Invalid or missing symbol' };
  }

  return { valid: true, type, symbol };
}

/**
 * Connection state tracker
 * Tracks subscriptions and message rate for each connection
 */
class ConnectionState {
  constructor(maxSubscriptions, maxMessagesPerMinute) {
    this.subscriptions = new Set();
    this.maxSubscriptions = maxSubscriptions;
    this.maxMessagesPerMinute = maxMessagesPerMinute;
    this.messageCount = 0;
    this.windowStart = Date.now();
  }

  /**
   * Check if can subscribe to a symbol
   * @param {string} symbol
   * @returns {{allowed: boolean, reason?: string}}
   */
  canSubscribe(symbol) {
    if (this.subscriptions.has(symbol)) {
      return { allowed: true }; // Already subscribed, no-op
    }

    if (this.subscriptions.size >= this.maxSubscriptions) {
      return {
        allowed: false,
        reason: `Subscription limit reached (max: ${this.maxSubscriptions})`
      };
    }

    return { allowed: true };
  }

  /**
   * Add subscription
   * @param {string} symbol
   */
  addSubscription(symbol) {
    this.subscriptions.add(symbol);
  }

  /**
   * Remove subscription
   * @param {string} symbol
   */
  removeSubscription(symbol) {
    this.subscriptions.delete(symbol);
  }

  /**
   * Check message rate limit
   * @returns {{allowed: boolean, reason?: string}}
   */
  checkMessageRate() {
    const now = Date.now();
    const windowMs = 60000; // 1 minute

    // Reset window if expired
    if (now - this.windowStart >= windowMs) {
      this.messageCount = 0;
      this.windowStart = now;
    }

    this.messageCount++;

    if (this.messageCount > this.maxMessagesPerMinute) {
      return {
        allowed: false,
        reason: `Message rate limit exceeded (max: ${this.maxMessagesPerMinute}/min)`
      };
    }

    return { allowed: true };
  }
}

/**
 * Handle WebSocket connection
 * @param {Request} request
 * @param {Object} config - Worker config
 * @param {ExecutionContext} ctx
 * @returns {Promise<Response>}
 */
export async function handleWebSocket(request, config, ctx) {
  const origin = request.headers.get("Origin") || "";

  // SECURITY: Check CORS
  if (!isAllowedOrigin(origin, config.allowedOrigins)) {
    return new Response(JSON.stringify({ error: "Forbidden origin" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }

  // SECURITY: Verify WebSocket upgrade
  if (request.headers.get("Upgrade") !== "websocket") {
    return new Response(JSON.stringify({ error: "Expected WebSocket upgrade" }), {
      status: 426,
      headers: { "Content-Type": "application/json" }
    });
  }

  // SECURITY: Rate limiting (strict per-IP, no fallback)
  // CF-Connecting-IP is always present in Cloudflare Workers
  const clientIP = request.headers.get("CF-Connecting-IP");

  if (!clientIP) {
    // This should never happen in CF Workers, but defense in depth
    console.error('[WS] CRITICAL: CF-Connecting-IP header missing');
    return new Response(JSON.stringify({
      error: "Unable to identify client"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const rateLimit = checkRateLimit(
    `ws:${clientIP}`,
    config.rateLimitRequests,
    config.rateLimitWindowMs
  );

  if (!rateLimit.allowed) {
    console.warn(`[WS] Rate limited IP: ${clientIP}`);
    return new Response(JSON.stringify({
      error: "Rate limit exceeded",
      retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
    }), {
      status: 429,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Create WebSocket pair
  const pair = new WebSocketPair();
  const [client, server] = Object.values(pair);
  server.accept();

  // Track connection state (subscriptions + message rate)
  const connState = new ConnectionState(
    config.wsMaxSubscriptions,
    config.wsMaxMessagesPerMinute
  );

  // Track last pong for health check
  let lastPongTime = Date.now();

  // Keep-alive ping interval
  const keepAliveInterval = setInterval(() => {
    try {
      server.send(JSON.stringify({ type: "ping", timestamp: Date.now() }));
    } catch (error) {
      console.error("Keep-alive ping error:", error);
    }
  }, config.wsKeepAliveMs);

  // Health check interval (verify pongs)
  const healthCheckInterval = setInterval(() => {
    const timeSincePong = Date.now() - lastPongTime;
    if (timeSincePong > config.wsPongTimeoutMs) {
      console.warn(`WebSocket health check failed: no pong for ${timeSincePong}ms`);
      cleanup();
      try { server.close(1011, "No pong timeout"); } catch {}
    }
  }, 30000);

  // Cleanup function
  const cleanup = () => {
    try { clearInterval(keepAliveInterval); } catch {}
    try { clearInterval(healthCheckInterval); } catch {}
  };

  // Connect to upstream Finnhub WebSocket in background
  ctx.waitUntil((async () => {
    const wsUrl = `${config.wsBase}?token=${encodeURIComponent(config.apiKey)}`;

    let upstreamResp, upstream;
    try {
      // HTTPS + Upgrade header for Cloudflare Workers
      upstreamResp = await fetch(wsUrl, {
        headers: { "Upgrade": "websocket" }
      });

      upstream = upstreamResp.webSocket;
      if (!upstream) {
        console.error("Upstream did not return webSocket");
        server.close(1011, "Upstream upgrade failed");
        cleanup();
        return;
      }

      upstream.accept();
    } catch (error) {
      console.error("WS upstream connect error:", error);
      try { server.close(1011, "Upstream connection failed"); } catch {}
      cleanup();
      return;
    }

    // Bidirectional message bridge with validation
    server.addEventListener("message", (evt) => {
      try {
        // SECURITY: Check message rate limit
        const rateCheck = connState.checkMessageRate();
        if (!rateCheck.allowed) {
          console.warn(`[WS] ${rateCheck.reason} for IP ${clientIP}`);
          server.close(1008, rateCheck.reason);
          cleanup();
          return;
        }

        // SECURITY: Validate message format
        const validation = validateMessage(evt.data);

        if (!validation.valid) {
          console.warn(`[WS] Invalid message from ${clientIP}: ${validation.reason}`);
          // Silently drop invalid messages (don't close connection to avoid DoS)
          return;
        }

        // Handle pong (heartbeat response)
        if (validation.type === 'pong') {
          lastPongTime = Date.now();
          return; // Don't forward pong to upstream
        }

        // Handle subscribe
        if (validation.type === 'subscribe') {
          const subCheck = connState.canSubscribe(validation.symbol);
          if (!subCheck.allowed) {
            console.warn(`[WS] ${subCheck.reason} for IP ${clientIP}`);
            server.close(1008, subCheck.reason);
            cleanup();
            return;
          }
          connState.addSubscription(validation.symbol);
        }

        // Handle unsubscribe
        if (validation.type === 'unsubscribe') {
          connState.removeSubscription(validation.symbol);
        }

        // Forward validated message to upstream
        upstream.send(evt.data);

      } catch (error) {
        console.error("Error processing message:", error);
      }
    });

    upstream.addEventListener("message", (evt) => {
      try {
        server.send(evt.data);
      } catch (error) {
        console.error("Error forwarding to client:", error);
      }
    });

    // Propagate close/error events
    const closeBoth = (code = 1000, reason = "") => {
      try { server.close(code, reason); } catch {}
      try { upstream.close(code, reason); } catch {}
      cleanup();
    };

    server.addEventListener("close", () => closeBoth(1000, "client closed"));
    upstream.addEventListener("close", () => closeBoth(1000, "upstream closed"));
    server.addEventListener("error", () => closeBoth(1011, "client error"));
    upstream.addEventListener("error", () => closeBoth(1011, "upstream error"));
  })());

  // Return 101 Switching Protocols immediately
  return new Response(null, {
    status: 101,
    webSocket: client
  });
}
