// src/app/api/cancel-subscription/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { safeCompare } from "@/utils/security";
import {
  createErrorResponse,
  ErrorType,
  generateRequestId,
} from "@/utils/api-error";

// This endpoint simulates a subscription cancellation directly
export async function GET(req: NextRequest) {
  const requestId = generateRequestId();

  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const secretKey = searchParams.get("secretKey");

    // Basic security check
    if (
      !secretKey ||
      !safeCompare(secretKey, process.env.ADMIN_SECRET_KEY || "")
    ) {
      return createErrorResponse(
        "Invalid or missing secret key",
        ErrorType.AUTHENTICATION,
        requestId
      );
    }

    if (!email) {
      return createErrorResponse(
        "Email parameter is required",
        ErrorType.VALIDATION,
        requestId
      );
    }

    try {
      // Find user by email
      const usersRef = adminDb.collection("users");
      const querySnapshot = await usersRef
        .where("email", "==", email)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        return createErrorResponse(
          `No user found with email: ${email}`,
          ErrorType.NOT_FOUND,
          requestId
        );
      }

      const userDoc = querySnapshot.docs[0];
      const userId = userDoc.id;

      // Update the document
      await adminDb.collection("users").doc(userId).update({
        subscriptionStatus: "canceled",
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: `User ${userId} (${email}) subscription status set to canceled`,
      });
    } catch (dbError) {
      return createErrorResponse(dbError, ErrorType.SERVER_ERROR, requestId);
    }
  } catch (error) {
    return createErrorResponse(error, ErrorType.SERVER_ERROR, requestId);
  }
}
