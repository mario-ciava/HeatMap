/**
 * CORS Handler
 * Secure CORS implementation with strict origin validation
 *
 * SECURITY:
 * - Wildcards (*) are NEVER allowed
 * - 'null' origin is NEVER allowed
 * - Origins must be pre-validated and normalized by config.js
 * - Case-insensitive matching (origins already lowercased)
 */

/**
 * Check if origin is allowed
 * @param {string} origin - Request origin (from request header)
 * @param {string[]} allowedOrigins - Pre-validated list from config
 * @returns {boolean}
 */
export function isAllowedOrigin(origin, allowedOrigins) {
  // SECURITY: No origin header = BLOCKED (server-to-server requests)
  if (!origin) {
    console.warn('[CORS] Blocked request: missing Origin header');
    return false;
  }

  // SECURITY: Empty allowlist = BLOCKED (must be explicitly configured)
  if (!allowedOrigins || allowedOrigins.length === 0) {
    console.error('[CORS] Blocked request: allowedOrigins not configured');
    return false;
  }

  // SECURITY: Explicit rejection of 'null' origin
  if (origin.toLowerCase() === 'null') {
    console.warn('[CORS] Blocked request: null origin not allowed');
    return false;
  }

  // Normalize incoming origin for comparison
  const normalizedOrigin = origin.trim().toLowerCase();

  // SECURITY: Wildcards are NEVER allowed in config
  // (config.js already validates this, but double-check for defense in depth)
  if (allowedOrigins.includes('*')) {
    console.error('[CORS] CRITICAL: Wildcard (*) found in allowedOrigins - rejecting ALL requests');
    return false;
  }

  // Check against allowlist (exact match, case-insensitive)
  const allowed = allowedOrigins.includes(normalizedOrigin);

  if (!allowed) {
    console.warn(`[CORS] Blocked origin: ${origin}`);
  }

  return allowed;
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
