// src/app/api/update-subscriptions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// This is an admin-only route that updates all existing users with missing subscription status
export async function GET(req: NextRequest) {
  try {
    // Check for admin secret key to prevent unauthorized access
    const { searchParams } = new URL(req.url);
    const secretKey = searchParams.get("secretKey");

    if (
      !secretKey ||
      !safeCompare(secretKey, process.env.ADMIN_SECRET_KEY || "")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all users from Firestore
    const usersRef = adminDb.collection("users");
    const snapshot = await usersRef.get();

    if (snapshot.empty) {
      return NextResponse.json({ message: "No users found" });
    }

    let updatedCount = 0;
    let errorCount = 0;

    // Process each user
    for (const doc of snapshot.docs) {
      const userData = doc.data();

      // Only update users without a subscription status
      if (!userData.subscriptionStatus) {
        try {
          // If they've paid, set status to active; otherwise, set to pending
          const status = userData.hasPaid ? "active" : "pending";

          await adminDb.collection("users").doc(doc.id).update({
            subscriptionStatus: status,
            updatedAt: new Date().toISOString(),
          });

          updatedCount++;
        } catch (error) {
          console.error(`Error updating user ${doc.id}:`, error);
          errorCount++;
        }
      }
    }

    return NextResponse.json({
      message: `Updated ${updatedCount} users. Errors: ${errorCount}`,
    });
  } catch (error) {
    console.error("Error processing update:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
