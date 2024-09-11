/**
 * REST API Handler
 * Proxies REST requests to Finnhub with server-side token injection
 *
 * SECURITY:
 * - Path allow-list: only configured endpoints are accessible
 * - Rate limiting: strict per-IP enforcement (no fallback)
 * - Token injection: server-side only, never exposed to client
 */

import { isAllowedOrigin, withCORS } from './cors.js';
import { checkRateLimit, rateLimitExceeded, rateLimitHeaders } from './rate-limit.js';

/**
 * Strip any token parameter from client request
 * @param {URLSearchParams} searchParams
 */
function stripClientToken(searchParams) {
  if (searchParams.has("token")) {
    searchParams.delete("token");
  }
}

/**
 * Extract base path from URL (without query params)
 * @param {URL} url
 * @returns {string} Base path (e.g., '/quote')
 */
function extractBasePath(url) {
  // Remove /api prefix and extract path without query string
  const fullPath = url.pathname.replace(/^\/api/, "");

  // Get base path (first segment after /api)
  // Examples: /quote?symbol=AAPL -> /quote
  //           /stock/market-status -> /stock/market-status
  return fullPath.split('?')[0];
}

/**
 * Check if requested path is allowed
 * @param {string} path - Requested path
 * @param {Set<string>} allowedPaths - Set of allowed paths
 * @returns {boolean}
 */
function isPathAllowed(path, allowedPaths) {
  return allowedPaths.has(path);
}

/**
 * Build upstream Finnhub URL with server-side token
 * @param {string} requestUrl - Client request URL
 * @param {Object} config - Worker config
 * @returns {URL} Upstream URL
 */
function buildUpstreamURL(requestUrl, config) {
  const clientUrl = new URL(requestUrl);
  const path = clientUrl.pathname.replace(/^\/api/, "");
  const upstream = new URL(config.restBase + path);

  // Copy query params (excluding any client token)
  const searchParams = new URLSearchParams(clientUrl.search);
  stripClientToken(searchParams);

  // Add server-side token
  searchParams.append("token", config.apiKey);
  upstream.search = searchParams.toString();

  return upstream;
}

/**
 * Handle REST API request
 * @param {Request} request
 * @param {Object} config - Worker config
 * @returns {Promise<Response>}
 */
export async function handleREST(request, config) {
  const origin = request.headers.get("Origin") || "";

  // SECURITY: Check CORS
  if (!isAllowedOrigin(origin, config.allowedOrigins)) {
    return withCORS(
      new Response(JSON.stringify({ error: "Forbidden origin" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      }),
      origin,
      config.allowedOrigins
    );
  }

  // SECURITY: Only allow GET
  if (request.method !== "GET") {
    return withCORS(
      new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" }
      }),
      origin,
      config.allowedOrigins
    );
  }

  // SECURITY: Path allow-list (only expose necessary endpoints)
  const requestUrl = new URL(request.url);
  const requestedPath = extractBasePath(requestUrl);

  if (!isPathAllowed(requestedPath, config.allowedRestPaths)) {
    console.warn(`[REST] Blocked path: ${requestedPath}`);
    return withCORS(
      new Response(JSON.stringify({
        error: "Endpoint not available",
        path: requestedPath
      }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      }),
      origin,
      config.allowedOrigins
    );
  }

  // SECURITY: Rate limiting (strict per-IP, no fallback)
  // CF-Connecting-IP is always present in Cloudflare Workers
  const clientIP = request.headers.get("CF-Connecting-IP");

  if (!clientIP) {
    // This should never happen in CF Workers, but defense in depth
    console.error('[REST] CRITICAL: CF-Connecting-IP header missing');
    return withCORS(
      new Response(JSON.stringify({
        error: "Unable to identify client"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }),
      origin,
      config.allowedOrigins
    );
  }

  const rateLimit = checkRateLimit(
    `rest:${clientIP}`,
    config.rateLimitRequests,
    config.rateLimitWindowMs
  );

  if (!rateLimit.allowed) {
    console.warn(`[REST] Rate limited IP: ${clientIP}`);
    return withCORS(
      rateLimitExceeded(rateLimit),
      origin,
      config.allowedOrigins
    );
  }

  // Build upstream URL
  const upstreamUrl = buildUpstreamURL(request.url, config);

  // Fetch from Finnhub
  let response;
  try {
    response = await fetch(upstreamUrl.toString(), {
      method: "GET",
      headers: { "Accept": "application/json" },
      cf: { cacheTtl: 0, cacheEverything: false }
    });
  } catch (error) {
    console.error("REST upstream fetch error:", error);
    return withCORS(
      new Response(JSON.stringify({ error: "Upstream service unavailable" }), {
        status: 502,
        headers: { "Content-Type": "application/json" }
      }),
      origin,
      config.allowedOrigins
    );
  }

  // Add rate limit headers to response
  const headers = new Headers(response.headers);
  const rlHeaders = rateLimitHeaders({
    ...rateLimit,
    maxRequests: config.rateLimitRequests
  });
  for (const [key, value] of Object.entries(rlHeaders)) {
    headers.set(key, value);
  }

  const proxiedResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });

  return withCORS(proxiedResponse, origin, config.allowedOrigins);
}
