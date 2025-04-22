// src/app/payment/success/page.tsx
"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { updateUserPaymentStatus } from "@/lib/auth-service";
import { useFirebase } from "@/components/firebase-provider";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading } = useFirebase();

  const sessionId = searchParams.get("session_id");
  const paymentId = searchParams.get("payment_intent") || "direct-payment";

  useEffect(() => {
    async function processPayment() {
      if (user) {
        try {
          // Update payment status
          const paymentIdentifier = sessionId || paymentId;
          await updateUserPaymentStatus(user.uid, paymentIdentifier);

          // Redirect to static HTML page
          window.location.href = "/payment-success.html";
        } catch (error) {
          console.error("Error updating payment status:", error);
          router.push("/questionnaire-choice");
        }
      } else if (!loading && !user) {
        router.push("/");
      }
    }

    if (!loading) {
      processPayment();
    }
  }, [user, loading, sessionId, paymentId, router]);

  // Show loading state while processing
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="text-center">
        <div className="relative mb-6 flex justify-center">
          <div className="h-12 w-12 rounded-full border-4 border-neutral-800 border-t-[#F58327] animate-spin" />
        </div>
        <p className="text-white text-lg">Processing your payment...</p>
      </div>
    </div>
  );
}
