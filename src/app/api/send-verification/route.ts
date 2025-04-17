// src/app/api/send-verification/route.ts
import { NextRequest, NextResponse } from "next/server";
import { storeVerificationCode } from "@/lib/verification-service";
import { sendVerificationEmail } from "@/lib/email-service";
import { verifyCode } from "@/lib/verification-service";

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
  try {
    // Get client IP for rate limiting (corrected)
    const forwardedFor = req.headers.get("x-forwarded-for") || "";
    const ip = forwardedFor.split(",")[0].trim() || "unknown";

    // Check rate limit
    const withinLimit = await checkRateLimit(ip);
    if (!withinLimit) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please try again later." },
        { status: 429 }
      );
    }

    // Get email from request body
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Valid email address is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    // Generate and store verification code
    const verificationCode = await storeVerificationCode(email);

    // Send verification email
    const emailResult = await sendVerificationEmail(email, verificationCode);

    if (!emailResult.success) {
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    // Success response
    return NextResponse.json({
      success: true,
      message: "Verification code sent successfully",
    });
  } catch (error) {
    console.error("Error in verification process:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

// Verify code endpoint
export async function PUT(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and verification code are required" },
        { status: 400 }
      );
    }

    // Validate the verification code
    const isValid = await verifyCode(email, code);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 }
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

    return NextResponse.json(
      { error: "An error occurred while verifying your code" },
      { status: 500 }
    );
  }
}
