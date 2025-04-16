// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get response
  const response = NextResponse.next();

  // Add security headers
  // src/middleware.ts
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: blob: https://www.google.com https://media.discordapp.net; " + // Allow Google images // Allows images from discord
      "font-src 'self'; " +
      "connect-src 'self' " +
      "https://*.firebaseio.com " +
      "https://*.googleapis.com " +
      "https://firestore.googleapis.com " + // Add this explicitly
      "https://firebaseappcheck.googleapis.com " +
      "https://identitytoolkit.googleapis.com " +
      "https://securetoken.googleapis.com " +
      "wss://*.firebaseio.com " + // WebSocket connections
      "https://*.cloudfunctions.net; " + // For Firebase Functions
      "frame-src 'self' https://*.firebaseapp.com; " +
      "object-src 'none'; " +
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

  // HSTS (uncomment if you're using HTTPS)
  // response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  return response;
}

// Only run middleware on relevant paths (exclude static files)
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
