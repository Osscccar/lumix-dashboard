// src/app/api/send-reminder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendQuestionnaireReminderEmail } from "@/lib/email-service";
import { adminDb } from "@/lib/firebase-admin";
import {
  createErrorResponse,
  ErrorType,
  createValidationError,
  generateRequestId,
} from "@/utils/api-error";

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();

  try {
    // Get user data from request
    const body = await req.json().catch(() => ({}));
    const { userId, email } = body;

    if (!userId || !email) {
      return createValidationError(
        "Missing required fields",
        {
          userId: !userId ? "User ID is required" : undefined,
          email: !email ? "Email is required" : undefined,
        },
        requestId
      );
    }

    console.log(`API: Sending reminder email to ${email} for user ${userId}`);

    // Send reminder email
    const emailResult = await sendQuestionnaireReminderEmail(email, 1);

    if (!emailResult.success) {
      console.error("Failed to send reminder email:", emailResult.error);
      return createErrorResponse(
        emailResult.error || "Failed to send email",
        ErrorType.SERVER_ERROR,
        requestId
      );
    }

    console.log("Email sent successfully, updating user document");

    // Update user document
    try {
      await adminDb.collection("users").doc(userId).update({
        questionnaireReminderStatus: "sent",
        reminderEmailSentAt: new Date().toISOString(),
        questionnairePostponed: true,
        updatedAt: new Date().toISOString(),
      });

      console.log("User document updated successfully");
    } catch (dbError) {
      console.error("Error updating user document:", dbError);
      // Continue and return success even if the document update fails
      // The important part is that the email was sent
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in reminder API:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Unknown error",
      ErrorType.SERVER_ERROR,
      requestId
    );
  }
}
