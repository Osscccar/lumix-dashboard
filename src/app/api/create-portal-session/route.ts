// src/app/api/create-portal-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// Your Stripe Customer Portal link - replace with your actual link from Stripe dashboard
const STRIPE_PORTAL_LINK = process.env.STRIPE_PORTAL_LINK || "https://billing.stripe.com/p/login/test_yourPortalLink";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const action = searchParams.get("action"); // New parameter for handling renewal action
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    
    console.log(`Redirecting user ${userId} to Stripe portal${action ? ` for ${action}` : ''}`);
    
    try {
      // Get the user's email from Firestore using the admin SDK
      const userDoc = await adminDb.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        console.log(`User ${userId} not found in Firestore`);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      
      const userData = userDoc.data();
      const email = userData?.email;
      
      if (!email) {
        console.log(`No email found for user ${userId}`);
        return NextResponse.json({ 
          error: "User email not found" 
        }, { status: 400 });
      }
      
      console.log(`Found user email: ${email}`);
      
      // If action is renew, update the user's status to pending for a better UX
      if (action === "renew") {
        try {
          await adminDb.collection('users').doc(userId).update({
            subscriptionStatus: "pending",
            updatedAt: new Date().toISOString()
          });
          console.log(`Updated subscription status to pending for user ${userId}`);
        } catch (updateError) {
          console.error("Failed to update subscription status:", updateError);
          // Continue with portal redirect even if update fails
        }
      }
      
      // Add the email as a prefilled parameter to the portal link
      const portalUrl = `${STRIPE_PORTAL_LINK}?prefilled_email=${encodeURIComponent(email)}`;
      
      console.log(`Redirecting to portal: ${portalUrl}`);
      
      // Redirect to the portal
      return NextResponse.redirect(portalUrl);
      
    } catch (dbError) {
      console.error("Error accessing Firestore:", dbError);
      return NextResponse.json(
        { error: "Database error: " + (dbError instanceof Error ? dbError.message : String(dbError)) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error redirecting to portal:", error);
    return NextResponse.json(
      { error: "Error redirecting to portal: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}