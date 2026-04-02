// Simple in-memory rate limiter for edge functions
// Uses a Map to track request counts per key within a time window

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

/**
 * Check if a request should be rate limited.
 * @param key - Unique identifier (e.g., userId + functionName)
 * @param config - Rate limit configuration
 * @returns true if the request is allowed, false if rate limited
 */
export function checkRateLimit(key: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 });
    return true;
  }

  if (entry.count >= config.maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * Returns a 429 Too Many Requests response
 */
export function rateLimitResponse(corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: 'Demasiadas solicitudes. Intente de nuevo más tarde.' }),
    {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}
