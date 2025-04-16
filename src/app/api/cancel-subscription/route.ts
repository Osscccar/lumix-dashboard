// src/app/api/cancel-subscription/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// This endpoint simulates a subscription cancellation directly
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const secretKey = searchParams.get("secretKey");
    
    // Basic security check
    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    
    try {
      // Find user by email
      const usersRef = adminDb.collection('users');
      const querySnapshot = await usersRef.where("email", "==", email).limit(1).get();
      
      if (querySnapshot.empty) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      
      const userDoc = querySnapshot.docs[0];
      const userId = userDoc.id;
      
      // Update the document
      await adminDb.collection('users').doc(userId).update({
        subscriptionStatus: "canceled",
        updatedAt: new Date().toISOString()
      });
      
      return NextResponse.json({ 
        success: true,
        message: `User ${userId} (${email}) subscription status set to canceled` 
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error processing cancellation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}