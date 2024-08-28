/**
 * Rate Limiter
 * Simple in-memory rate limiting per IP address
 * Uses sliding window algorithm
 */

const rateLimitStore = new Map();

/**
 * Clean up expired entries (run periodically)
 */
function cleanup() {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.windowStart > data.windowMs + 60000) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every 2 minutes
setInterval(cleanup, 120000);

/**
 * Check if request should be rate limited
 * @param {string} identifier - Client identifier (IP or origin)
 * @param {number} maxRequests - Max requests per window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(identifier, maxRequests, windowMs) {
  const now = Date.now();
  let data = rateLimitStore.get(identifier);

  // Initialize or reset window
  if (!data || now - data.windowStart >= windowMs) {
    data = {
      windowStart: now,
      windowMs,
      count: 0
    };
    rateLimitStore.set(identifier, data);
  }

  // Increment counter
  data.count++;

  // Check limit
  const allowed = data.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - data.count);
  const resetTime = data.windowStart + windowMs;

  return { allowed, remaining, resetTime };
}

/**
 * Get rate limit headers
 * @param {Object} rateLimitResult
 * @returns {Object} Headers
 */
export function rateLimitHeaders(rateLimitResult) {
  return {
    "X-RateLimit-Limit": String(rateLimitResult.maxRequests || 50),
    "X-RateLimit-Remaining": String(rateLimitResult.remaining),
    "X-RateLimit-Reset": String(Math.floor(rateLimitResult.resetTime / 1000)),
  };
}

/**
 * Create rate limit exceeded response
 * @param {Object} rateLimitResult
 * @returns {Response}
 */
export function rateLimitExceeded(rateLimitResult) {
  const retryAfter = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000);

  return new Response(JSON.stringify({
    error: "Rate limit exceeded",
    retryAfter
  }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(retryAfter),
      ...rateLimitHeaders(rateLimitResult)
    }
  });
}
