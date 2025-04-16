// src/app/payment/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFirebase } from "@/components/firebase-provider";

export default function PaymentPage() {
  const router = useRouter();
  const { user, userData, loading } = useFirebase();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState("");

  // You can create this link in your Stripe dashboard under Products & Pricing > Payment links
  // Make sure to set up the webhook properly so it sends the right data to your webhook endpoint
  const STRIPE_PAYMENT_LINK =
    process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ||
    "https://buy.stripe.com/6oE2bUf8T65W5mo005";

  useEffect(() => {
    // Redirect logic
    if (!loading) {
      if (!user) {
        // No user is logged in, redirect to sign in
        router.push("/");
      } else if (userData?.hasPaid) {
        // User has already paid
        if (!userData.completedQuestionnaire) {
          router.push("/questionnaire");
        } else {
          router.push("/dashboard");
        }
      }
    }
  }, [loading, user, userData, router]);

  const handleProceedToPayment = () => {
    if (!user || !userData) return;

    setIsRedirecting(true);

    // Add user ID and email as URL parameters to identify the user
    // Note: Stripe payment links don't support custom metadata in the same way checkout sessions do
    // So we'll need to handle this in the webhook by retrieving the user info from the URL or cookies
    const paymentUrl = new URL(STRIPE_PAYMENT_LINK);
    paymentUrl.searchParams.append("uid", user.uid);
    paymentUrl.searchParams.append("email", user.email || "");

    // Redirect to Stripe payment link
    window.location.href = paymentUrl.toString();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-neutral-300 border-t-[#F58327] mx-auto"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-white p-8 shadow-md">
          <h2 className="mb-6 text-center text-2xl font-bold text-neutral-900">
            Complete Your Purchase
          </h2>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="mb-8 space-y-4">
            <div className="flex justify-between border-b pb-4">
              <span className="font-medium">Website Design & Development</span>
              <span className="font-bold">$999.00</span>
            </div>

            <div className="flex justify-between border-b pb-4">
              <span className="font-medium">Tax</span>
              <span>$0.00</span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="text-lg font-bold">Total</span>
              <span className="text-lg font-bold">$999.00</span>
            </div>
          </div>

          <div className="rounded-md bg-neutral-50 p-4 mb-6">
            <p className="text-sm text-neutral-600">
              Your payment is processed securely through Stripe. After payment,
              you'll be asked some questions about your website requirements.
            </p>
          </div>

          <button
            onClick={handleProceedToPayment}
            disabled={isRedirecting}
            className="cursor-pointer w-full rounded-md bg-[#F58327] px-4 py-2 text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-75"
          >
            {isRedirecting ? "Redirecting to payment..." : "Proceed to Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
