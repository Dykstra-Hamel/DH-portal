// Simple in-memory rate limiting (for production, use Redis or similar)
interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const windowStart = now - config.windowMs

  // Clean up old entries
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < windowStart) {
      delete store[key]
    }
  })

  // Get or create entry for this identifier
  if (!store[identifier] || store[identifier].resetTime < windowStart) {
    store[identifier] = {
      count: 1,
      resetTime: now + config.windowMs
    }
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: store[identifier].resetTime
    }
  }

  // Increment counter
  store[identifier].count++

  if (store[identifier].count > config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: store[identifier].resetTime
    }
  }

  return {
    success: true,
    remaining: config.maxRequests - store[identifier].count,
    resetTime: store[identifier].resetTime
  }
}

export function getRateLimitIdentifier(request: Request): string {
  // In production, you might want to use user ID instead of IP
  // for authenticated routes, or a combination of both
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  return ip
}