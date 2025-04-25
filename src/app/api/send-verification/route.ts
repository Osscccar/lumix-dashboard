// src/app/api/send-verification/route.ts
import { NextRequest, NextResponse } from "next/server";
import { storeVerificationCode } from "@/lib/verification-service";
import { sendVerificationEmail } from "@/lib/email-service";
import { verifyCode } from "@/lib/verification-service";
import {
  createErrorResponse,
  ErrorType,
  createValidationError,
  generateRequestId,
} from "@/utils/api-error";

// Simple in-memory rate limiting
const inMemoryLimiter: Record<string, { count: number; reset: number }> = {};

// Rate limiting function
async function checkRateLimit(ip: string): Promise<boolean> {
  const MAX_REQUESTS = 5; // 5 requests
  const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  const now = Date.now();

  // Clean up expired entries
  Object.keys(inMemoryLimiter).forEach((key) => {
    if (inMemoryLimiter[key].reset < now) {
      delete inMemoryLimiter[key];
    }
  });

  // Check or initialize rate limiter for this IP
  if (!inMemoryLimiter[ip]) {
    inMemoryLimiter[ip] = {
      count: 1,
      reset: now + WINDOW_MS,
    };
    return true;
  }

  // Increment and check
  inMemoryLimiter[ip].count += 1;
  return inMemoryLimiter[ip].count <= MAX_REQUESTS;
}

// Send verification code endpoint
export async function POST(req: NextRequest) {
  const requestId = generateRequestId();

  try {
    // Get client IP for rate limiting (corrected)
    const forwardedFor = req.headers.get("x-forwarded-for") || "";
    const ip = forwardedFor.split(",")[0].trim() || "unknown";

    // Check rate limit
    const withinLimit = await checkRateLimit(ip);
    if (!withinLimit) {
      return createErrorResponse(
        "Too many verification attempts",
        ErrorType.RATE_LIMIT,
        requestId
      );
    }

    // Get email from request body
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== "string") {
      return createValidationError(
        "Valid email address is required",
        { email: "Email is required and must be a string" },
        requestId
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createValidationError(
        "Please provide a valid email address",
        { email: "Invalid email format" },
        requestId
      );
    }

    // Generate and store verification code
    const verificationCode = await storeVerificationCode(email);

    // Send verification email
    const emailResult = await sendVerificationEmail(email, verificationCode);

    if (!emailResult.success) {
      return createErrorResponse(
        emailResult.error || "Failed to send verification email",
        ErrorType.SERVER_ERROR,
        requestId
      );
    }

    // Success response
    return NextResponse.json({
      success: true,
      message: "Verification code sent successfully",
    });
  } catch (error) {
    console.error("Error in verification process:", error);
    return createErrorResponse(error, ErrorType.SERVER_ERROR, requestId);
  }
}

// Verify code endpoint
export async function PUT(req: NextRequest) {
  const requestId = generateRequestId();

  try {
    const body = await req.json().catch(() => ({}));
    const { email, code } = body;

    if (!email || !code) {
      return createValidationError(
        "Email and verification code are required",
        {
          email: !email ? "Email is required" : undefined,
          code: !code ? "Verification code is required" : undefined,
        },
        requestId
      );
    }

    // Validate the verification code
    const isValid = await verifyCode(email, code);

    if (!isValid) {
      return createValidationError(
        "Invalid or expired verification code",
        { code: "Invalid or expired verification code" },
        requestId
      );
    }

    // Code is valid
    return NextResponse.json({
      success: true,
      verified: true,
      message: "Email verification successful",
    });
  } catch (error) {
    console.error("Error verifying code:", error);
    return createErrorResponse(error, ErrorType.SERVER_ERROR, requestId);
  }
}
