/**
 * CORS Handler
 * Secure CORS implementation with strict origin validation
 */

/**
 * Check if origin is allowed
 * @param {string} origin - Request origin
 * @param {string[]} allowedOrigins - List of allowed origins
 * @returns {boolean}
 */
export function isAllowedOrigin(origin, allowedOrigins) {
  // SECURITY: No origin = server-to-server = BLOCKED
  if (!origin) return false;

  // SECURITY: Empty allowlist = BLOCKED (must be explicitly configured)
  if (allowedOrigins.length === 0) return false;

  // Check against allowlist
  return allowedOrigins.includes("*") || allowedOrigins.includes(origin);
}

/**
 * Generate CORS headers
 * @param {string} origin - Request origin
 * @param {string[]} allowedOrigins - List of allowed origins
 * @returns {Object} CORS headers
 */
export function corsHeaders(origin, allowedOrigins) {
  const allowed = isAllowedOrigin(origin, allowedOrigins);

  return {
    "Access-Control-Allow-Origin": allowed ? origin : "null",
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Requested-With",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * Wrap response with CORS headers
 * @param {Response} response - Original response
 * @param {string} origin - Request origin
 * @param {string[]} allowedOrigins - List of allowed origins
 * @returns {Response} Response with CORS headers
 */
export function withCORS(response, origin, allowedOrigins) {
  const headers = new Headers(response.headers || {});
  const cors = corsHeaders(origin, allowedOrigins);

  for (const [key, value] of Object.entries(cors)) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status || 200,
    statusText: response.statusText,
    headers
  });
}

/**
 * Handle OPTIONS preflight request
 * @param {Request} request
 * @param {string[]} allowedOrigins
 * @returns {Response}
 */
export function handleOptions(request, allowedOrigins) {
  const origin = request.headers.get("Origin") || "";
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin, allowedOrigins)
  });
}
