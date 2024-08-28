/**
 * WebSocket Handler
 * Bidirectional WebSocket proxy with keep-alive and rate limiting
 */

import { isAllowedOrigin } from './cors.js';
import { checkRateLimit } from './rate-limit.js';

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

  // SECURITY: Rate limiting (per IP)
  const clientIP = request.headers.get("CF-Connecting-IP") || origin;
  const rateLimit = checkRateLimit(
    `ws:${clientIP}`,
    config.rateLimitRequests,
    config.rateLimitWindowMs
  );

  if (!rateLimit.allowed) {
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

    // Bidirectional message bridge
    server.addEventListener("message", (evt) => {
      try {
        // Check for pong response to our ping
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === "pong") {
            lastPongTime = Date.now();
            return; // Don't forward pong to upstream
          }
        } catch {}

        // Forward to upstream
        upstream.send(evt.data);
      } catch (error) {
        console.error("Error forwarding to upstream:", error);
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
