// app/api/auth/password-reset/route.ts
import { NextRequest, NextResponse } from "next/server";
import { initAdmin, adminAuth } from "@/lib/firebase-admin";
import { sendPasswordResetEmail } from "@/lib/email-service";

// Make sure Firebase Admin is initialized
initAdmin();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // IMPORTANT: Use EXACTLY the same domain that's listed in your Firebase Console's
    // Authorized Domains list. Don't add http:// or https:// to the beginning.
    const domain =
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
      "your-project-id.firebaseapp.com";

    // Create action code settings with the correct domain format
    const actionCodeSettings = {
      url: `https://${domain}/?email=${encodeURIComponent(email)}`,
      handleCodeInApp: false,
    };

    console.log("Reset URL:", actionCodeSettings.url);

    const link = await adminAuth.generatePasswordResetLink(
      email,
      actionCodeSettings
    );

    // Send the custom email using Mailgun
    const result = await sendPasswordResetEmail(email, link);

    if (!result.success) {
      throw new Error(result.error || "Failed to send password reset email");
    }

    return NextResponse.json({
      success: true,
      message: "Password reset email sent successfully",
    });
  } catch (error) {
    console.error("Error sending password reset email:", error);
    let errorMessage = "An unexpected error occurred";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      // Handle Firebase Auth errors
      if (errorMessage.includes("user-not-found")) {
        statusCode = 404;
        errorMessage = "No account found with this email address";
      } else if (errorMessage.includes("invalid-email")) {
        statusCode = 400;
        errorMessage = "Please enter a valid email address";
      } else if (errorMessage.includes("Domain not allowlisted")) {
        statusCode = 500;
        errorMessage =
          "The domain for password reset is not authorized in Firebase Console. Please check your Firebase Authentication settings.";
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to send password reset email",
        error: errorMessage,
      },
      { status: statusCode }
    );
  }
}
