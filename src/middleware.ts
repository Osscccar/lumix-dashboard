// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Rate limit configurations
const RATE_LIMIT_CONFIG = {
  auth: { limit: 5, window: 60 * 5 },
  default: { limit: 20, window: 60 },
  file: { limit: 10, window: 60 },
  tenweb: { limit: 10, window: 60 * 60 }, // Stricter rate limit for 10web API (2 requests per hour)
};

// Define a proper return type for the rate limit function
type RateLimitResult = NextResponse | { headers: Headers } | null;

// Rate limiting function
async function applyRateLimit(
  req: NextRequest,
  type: "auth" | "file" | "default" | "tenweb" = "default"
): Promise<RateLimitResult> {
  // If Redis is not configured, skip rate limiting
  if (!redis) {
    console.warn("Redis is not configured. Rate limiting is disabled.");
    return null;
  }

  // Get client IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  // Get URI path
  const path = req.nextUrl.pathname;

  // Create a unique key for this IP and endpoint type
  const key = `rate-limit:${ip}:${type}:${path}`;

  const config = RATE_LIMIT_CONFIG[type];

  try {
    // Get current count for this IP and increment
    const currentCount = await redis.incr(key);

    // If this is the first request, set expiry
    if (currentCount === 1) {
      await redis.expire(key, config.window);
    }

    // Get remaining TTL for this key
    const ttl = await redis.ttl(key);

    // Add rate limit headers
    const headers = new Headers();
    headers.set("X-RateLimit-Limit", config.limit.toString());
    headers.set(
      "X-RateLimit-Remaining",
      Math.max(0, config.limit - currentCount).toString()
    );
    headers.set("X-RateLimit-Reset", ttl.toString());

    // If rate limit exceeded
    if (currentCount > config.limit) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": ttl.toString(),
            "X-RateLimit-Limit": config.limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": ttl.toString(),
          },
        }
      );
    }

    return { headers };
  } catch (error) {
    console.error("Rate limiting error:", error);
    // If an error occurs, allow the request (fail open)
    return null;
  }
}

export async function middleware(request: NextRequest) {
  // Apply rate limiting based on endpoint type
  let rateLimitResult: RateLimitResult = null;

  // Apply rate limiting for authentication-related endpoints
  if (
    request.nextUrl.pathname.includes("/api/send-verification") ||
    request.nextUrl.pathname.includes("/api/webhook")
  ) {
    rateLimitResult = await applyRateLimit(request, "auth");
  }
  // Apply rate limiting for file uploads
  else if (
    request.method === "POST" &&
    (request.nextUrl.pathname.includes("/api/upload") ||
      request.nextUrl.pathname.includes("/api/file"))
  ) {
    rateLimitResult = await applyRateLimit(request, "file");
  }
  // Apply stricter rate limiting for 10web website generation
  else if (request.nextUrl.pathname.includes("/api/generate-website")) {
    rateLimitResult = await applyRateLimit(request, "tenweb");
  }
  // Apply default rate limiting for all other API endpoints
  else if (request.nextUrl.pathname.startsWith("/api/")) {
    rateLimitResult = await applyRateLimit(request, "default");
  }

  // If rate limit response was generated, return it
  if (rateLimitResult && rateLimitResult instanceof NextResponse) {
    return rateLimitResult;
  }

  // Get response
  const response = NextResponse.next();

  // Check if in development mode
  const isDev = process.env.NODE_ENV === "development";

  // Add security headers
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; " +
      // Script sources
      `script-src 'self' 'unsafe-inline' ${
        isDev ? "'unsafe-eval'" : ""
      } https://cdnjs.cloudflare.com https://js.stripe.com https://apis.google.com https://*.googleapis.com https://www.googletagmanager.com https://*.vercel-scripts.com https://*.vercel-insights.com https://*.google-analytics.com https://*.analytics.google.com https://*.doubleclick.net https://www.google.com https://googleads.g.doubleclick.net https://connect.facebook.net https://www.facebook.com https://*.facebook.com https://*.facebook.net https://*.googleadservices.com https://*.posthog.com https://*.i.posthog.com; ` +
      // Style sources
      "style-src 'self' 'unsafe-inline'; " +
      // Image sources
      "img-src 'self' data: blob: https://media.discordapp.net https://www.google.com https://www.google.com.au https://sitechecker.pro https://*.googleapis.com https://*.stripe.com https://*.vercel-insights.com https://*.google-analytics.com https://*.doubleclick.net https://*.googleadservices.com https://www.facebook.com https://*.facebook.com https://*.fbcdn.net; " +
      // Font sources
      "font-src 'self'; " +
      // Connection sources
      "connect-src 'self' " +
      "https://*.firebaseio.com " +
      "https://*.googleapis.com " +
      "https://firestore.googleapis.com " +
      "https://firebaseappcheck.googleapis.com " +
      "https://identitytoolkit.googleapis.com " +
      "https://securetoken.googleapis.com " +
      "wss://*.firebaseio.com " +
      "https://*.cloudfunctions.net " +
      "https://api.stripe.com " +
      "https://*.vercel-insights.com " +
      "https://*.vercel-analytics.com " +
      "https://*.vercel-scripts.com " +
      "https://*.google-analytics.com " +
      "https://va.vercel-scripts.com " +
      "https://*.doubleclick.net " +
      "https://stats.g.doubleclick.net " +
      "https://*.googleadservices.com " +
      "https://api.10web.io " +
      "https://www.google.com " +
      "https://www.google.com.au " +
      "https://googleads.g.doubleclick.net " +
      "https://*.facebook.com " +
      "https://*.facebook.net " +
      "https://connect.facebook.net " +
      "https://*.posthog.com " +
      "https://*.i.posthog.com " +
      "https://us.i.posthog.com " +
      "https://us-assets.i.posthog.com " +
      (isDev ? "localhost:* ws://localhost:* " : "") +
      "; " +
      // Frame sources
      "frame-src 'self' https://*.firebaseapp.com https://js.stripe.com https://hooks.stripe.com https://apis.google.com https://www.googletagmanager.com https://*.doubleclick.net https://td.doubleclick.net https://bid.g.doubleclick.net https://www.facebook.com https://*.facebook.com; " +
      // Object sources
      "object-src 'none'; " +
      // Base URI
      "base-uri 'self';"
  );

  // Add anti-clickjacking header
  response.headers.set("X-Frame-Options", "DENY");

  // Add XSS protection header
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Set referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // HSTS
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  // Add rate limit headers if available
  if (rateLimitResult && "headers" in rateLimitResult) {
    for (const [key, value] of rateLimitResult.headers.entries()) {
      response.headers.set(key, value);
    }
  }

  return response;
}

// Keep your existing matcher config
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
