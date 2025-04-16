// src/app/api/test-webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// This endpoint allows you to simulate a cancellation event for testing
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const secretKey = searchParams.get("secretKey");
    
    // Basic security check
    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    
    try {
      // Update the user's subscription status to canceled
      const userRef = adminDb.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      
      // Update the document
      await userRef.update({
        subscriptionStatus: "canceled",
        updatedAt: new Date().toISOString()
      });
      
      return NextResponse.json({ 
        success: true,
        message: `User ${userId} subscription status set to canceled` 
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error processing test webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}