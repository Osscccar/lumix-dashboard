// src/lib/stripe-service.ts
import Stripe from "stripe";

// Instead of initializing at the module level, create a function that returns a Stripe instance
function getStripeInstance() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-03-31.basil",
  });
}

export async function createCheckoutSession(
  email: string,
  userId: string,
  successUrl: string,
  cancelUrl: string
) {
  try {
    // Initialize Stripe inside the function
    const stripe = getStripeInstance();
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Website Project",
              description: "Website design and development package",
            },
            unit_amount: 99900, // $999.00
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: email,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId,
        email: email,
      },
    });

    return { id: session.id, url: session.url };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
}

export async function getCheckoutSession(sessionId: string) {
  try {
    // Initialize Stripe inside the function
    const stripe = getStripeInstance();
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return session;
  } catch (error) {
    console.error("Error retrieving checkout session:", error);
    throw error;
  }
}