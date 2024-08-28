/**
 * REST API Handler
 * Proxies REST requests to Finnhub with server-side token injection
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

  // SECURITY: Rate limiting
  const clientIP = request.headers.get("CF-Connecting-IP") || origin;
  const rateLimit = checkRateLimit(
    `rest:${clientIP}`,
    config.rateLimitRequests,
    config.rateLimitWindowMs
  );

  if (!rateLimit.allowed) {
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
