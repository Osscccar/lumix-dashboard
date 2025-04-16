// src/app/api/webhook/stripe/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebase-admin";

// Create a function to get Stripe instance
function getStripeInstance() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-03-31.basil",
  });
}

// Update user payment status function
async function updateUserPaymentStatus(userId: string, paymentMethod: string): Promise<boolean> {
  try {
    console.log(`Updating payment status for user ${userId} with payment method ${paymentMethod}`);
    
    // Update the document using admin SDK
    await adminDb.collection('users').doc(userId).update({
      hasPaid: true,
      subscriptionStatus: "active", // Set status to active when payment is made
      stripeCustomerId: "direct-payment", // Keep using "direct-payment" for consistency
      paymentMethod: paymentMethod,
      updatedAt: new Date().toISOString()
    });
    
    console.log("User payment status updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating user payment status:", error);
    return false;
  }
}

// Update subscription status function
async function updateSubscriptionStatus(userId: string, status: string): Promise<boolean> {
  try {
    console.log(`Setting subscription status for user ${userId} to ${status}`);
    
    await adminDb.collection('users').doc(userId).update({
      subscriptionStatus: status,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`Successfully set subscription status to ${status} for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`Failed to update subscription status: ${error}`);
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  console.log("Received webhook request");
  
  // Save full request details for debugging
  try {
    // Get request headers for debugging
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    console.log("Webhook Request Headers:", JSON.stringify(headers, null, 2));
    console.log("Webhook Request Body Preview:", rawBody.substring(0, 200) + "...");
  } catch (logError) {
    console.error("Error logging request:", logError);
  }
  
  try {
    const signature = req.headers.get("stripe-signature") || "";
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
    
    console.log(`Signature: ${signature.substring(0, 20)}...`);
    console.log(`Using webhook secret: ${webhookSecret ? "Provided" : "Missing"}`);

    // Initialize Stripe inside the handler function
    const stripe = getStripeInstance();
    
    let event: Stripe.Event;

    // Verify webhook signature
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      console.log(`Webhook signature verified successfully!`);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      
      // Try to parse the event without verification (for debugging)
      try {
        const parsedBody = JSON.parse(rawBody);
        console.log("Event parsed without verification:", parsedBody.type);
      } catch (parseErr) {
        console.error("Failed to parse webhook body:", parseErr);
      }
      
      return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
    }

    // Log all incoming webhook events for debugging
    console.log(`⚡️ Webhook received! Event type: ${event.type}`);
    console.log(`Event ID: ${event.id}`);
    console.log(`Event data:`, JSON.stringify(event.data.object, null, 2));

    // For "checkout.session.completed" events
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const url = new URL(session.success_url || "");
      const uid = url.searchParams.get("uid") || session.metadata?.userId;
      
      if (!uid) {
        console.error("User ID not found in checkout session");
        return NextResponse.json({ error: "User ID not found" }, { status: 400 });
      }
      
      console.log(`Checkout completed for user: ${uid}`);
      
      // Update user payment status in Firebase
      const success = await updateUserPaymentStatus(uid, "checkout_session");
      
      if (!success) {
        console.error(`Failed to update user payment status for User ${uid}`);
        return NextResponse.json({ error: "Failed to update user payment status" }, { status: 500 });
      }
      
      console.log(`Successfully updated payment status for User ${uid}`);
    }

    // For any events related to subscriptions
    if (event.type.startsWith("customer.subscription.")) {
      console.log(`Processing subscription event: ${event.type}`);
      
      const subscription = event.data.object as Stripe.Subscription;
      
      // Get all possible identifiers from the subscription object
      const customerId = subscription.customer as string;
      const status = subscription.status;
      
      console.log(`Subscription status: ${status}`);
      console.log(`Customer ID: ${customerId}`);
      
      // Handle different subscription states
      let newUserStatus: string | null = null;
      let statusReason: string | null = null;
      
      if (event.type === "customer.subscription.deleted") {
        // Direct deletion
        newUserStatus = "canceled";
        statusReason = "Subscription was deleted";
      } else if (event.type === "customer.subscription.updated") {
        // Check if status changed to canceled or has cancel_at set
        if (status === "canceled") {
          newUserStatus = "canceled";
          statusReason = "Subscription status is 'canceled'";
        } else if (subscription.cancel_at && subscription.cancel_at > 0) {
          newUserStatus = "canceled";
          statusReason = `Subscription has cancel_at timestamp: ${subscription.cancel_at}`;
        } 
        // Check for reactivation cases
        else if (status === "active" || status === "trialing") {
          newUserStatus = "active";
          statusReason = `Subscription is now ${status}`;
        }
      } else if (event.type === "customer.subscription.created") {
        // New subscription
        newUserStatus = "active";
        statusReason = "New subscription created";
      }
      
      if (newUserStatus) {
        console.log(`Need to set user status to: ${newUserStatus} (Reason: ${statusReason})`);
        
        try {
          // Get customer details to find email
          let customerEmail: string | null = null;
          try {
            const customer = await stripe.customers.retrieve(customerId);
            if (!customer.deleted && 'email' in customer) {
              customerEmail = customer.email;
              console.log(`Found customer email: ${customerEmail}`);
            }
          } catch (customerErr) {
            console.error("Error retrieving customer:", customerErr);
          }
          
          // SEARCH ALL USERS regardless of customer ID or email match
          // This is a more aggressive approach for testing and debugging
          console.log("Searching ALL users to find a match...");
          
          const allUsersSnapshot = await adminDb.collection('users').get();
          console.log(`Found ${allUsersSnapshot.size} total users`);
          
          let matchedUserId: string | null = null;
          let matchReason: string | null = null;
          
          for (const doc of allUsersSnapshot.docs) {
            const userData = doc.data();
            
            // Log each user for debugging
            console.log(`Checking user ${doc.id}: ${userData.email}, stripeCustomerId: ${userData.stripeCustomerId}`);
            
            // Check for direct customer ID match
            if (userData.stripeCustomerId === customerId) {
              matchedUserId = doc.id;
              matchReason = "stripeCustomerId exact match";
              break;
            }
            
            // Check for email match if we have customer email
            if (customerEmail && userData.email && 
                userData.email.toLowerCase() === customerEmail.toLowerCase()) {
              matchedUserId = doc.id;
              matchReason = "email match";
              break;
            }
            
            // Check if this is a direct-payment user that might match
            if (userData.stripeCustomerId === "direct-payment" && customerEmail && 
                userData.email && userData.email.toLowerCase() === customerEmail.toLowerCase()) {
              matchedUserId = doc.id;
              matchReason = "direct-payment user with matching email";
              break;
            }
          }
          
          // If we found a user, update their subscription status
          if (matchedUserId) {
            console.log(`Found matching user: ${matchedUserId} (Reason: ${matchReason})`);
            
            const success = await updateSubscriptionStatus(matchedUserId, newUserStatus);
            if (success) {
              console.log(`Successfully updated subscription status to ${newUserStatus} for user ${matchedUserId}`);
            } else {
              console.error(`Failed to update subscription status for user ${matchedUserId}`);
            }
          } else {
            console.error(`Could not find any matching user for this subscription event`);
          }
          
        } catch (error) {
          console.error("Error processing subscription event:", error);
        }
      } else {
        console.log("No status change needed for this event");
      }
    }
    
    // For payment_intent.succeeded events (which occur with Payment Links)
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      const email = paymentIntent.receipt_email;
      const metadata = paymentIntent.metadata;
      
      let uid = metadata.uid;
      
      // Log the payment intent data
      console.log(`Payment intent succeeded. Email: ${email}, UID from metadata: ${uid}`);
      console.log(`Payment intent metadata:`, JSON.stringify(metadata, null, 2));
      
      // If we have an email but no UID in metadata, try to find the user
      if (email && !uid) {
        try {
          const usersRef = adminDb.collection('users');
          const querySnapshot = await usersRef.where("email", "==", email).get();
          
          if (!querySnapshot.empty) {
            // Get the first matching document
            uid = querySnapshot.docs[0].id;
            console.log(`Found user by email: ${uid}`);
          }
        } catch (error) {
          console.error("Error finding user by email:", error);
        }
      }
      
      if (!uid) {
        console.error("Could not determine user ID from payment intent");
        return NextResponse.json({ error: "User ID not found" }, { status: 400 });
      }
      
      console.log(`Payment intent succeeded for user: ${uid}`);
      
      // Update user payment status
      const success = await updateUserPaymentStatus(uid, "payment_intent");
      
      if (!success) {
        console.error("Failed to update user payment status in Firebase");
        return NextResponse.json({ error: "Failed to update user payment status" }, { status: 500 });
      }
      
      console.log(`Successfully updated payment status for User ${uid}`);
    }

    // Return 200 for all event types
    return NextResponse.json({ received: true, eventType: event.type });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}