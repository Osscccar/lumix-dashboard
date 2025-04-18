// src/app/api/send-reminder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendQuestionnaireReminderEmail } from "@/lib/email-service";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    // Get user data from request
    const { userId, email } = await req.json();

    if (!userId || !email) {
      console.error("Missing required fields:", { userId, email });
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(`API: Sending reminder email to ${email} for user ${userId}`);

    // Send reminder email
    const emailResult = await sendQuestionnaireReminderEmail(email, 1);

    if (!emailResult.success) {
      console.error("Failed to send reminder email:", emailResult.error);
      return NextResponse.json(
        { success: false, error: "Failed to send email" },
        { status: 500 }
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
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
