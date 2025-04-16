// src/app/plans/[plan]/page.tsx
"use client";

import { useEffect } from "react";
import { useFirebase } from "@/components/firebase-provider";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";

// Map of plan types to their stripe payment links
const STRIPE_PAYMENT_LINKS: Record<string, string> = {
  "launch-yearly": "https://buy.stripe.com/fZecQy9Oz51ScOQdR2",
  "launch-monthly": "https://buy.stripe.com/14k4k2e4P1PGeWY5kt",
  "business-yearly": "https://buy.stripe.com/9AQdUC3qbamcbKM14f",
  "business-monthly": "https://buy.stripe.com/4gw9EmbWHeCs3eg7sA",
  "enterprise-yearly": "https://buy.stripe.com/5kAbMu4uf3XO0247sC",
  "enterprise-monthly": "https://buy.stripe.com/14kdUC3qb8e4168bIP",
};

export default function PlanPage() {
  const router = useRouter();
  const params = useParams();
  const { user, userData, loading } = useFirebase();
  const plan = params.plan as string;

  useEffect(() => {
    // Wait for loading to complete and user data to be available
    if (loading) return;

    // Validate plan type
    if (!plan || !STRIPE_PAYMENT_LINKS[plan]) {
      console.error("Invalid plan type:", plan);
      window.location.href = "https://lumixdigital.com.au/pricing";
      return;
    }

    // If user is logged in and has already paid, redirect to dashboard
    if (user && userData?.hasPaid) {
      console.log("User already has a paid plan, redirecting to dashboard");
      router.push("/dashboard");
      return;
    }

    // Store selected plan in sessionStorage for registration
    sessionStorage.setItem("selectedPlan", plan);

    if (user) {
      // User is logged in but hasn't paid, redirect directly to Stripe
      const paymentUrl = new URL(STRIPE_PAYMENT_LINKS[plan]);
      paymentUrl.searchParams.append("uid", user.uid);
      paymentUrl.searchParams.append("email", user.email || "");
      paymentUrl.searchParams.append("plan", plan);
      window.location.href = paymentUrl.toString();
    } else {
      // User is not logged in, redirect to sign in page with plan info
      router.push(`/?plan=${encodeURIComponent(plan)}`);
    }
  }, [plan, user, userData, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative mb-6">
          <div className="h-1 w-24 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#F58327]"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
              }}
            ></motion.div>
          </div>
        </div>
        <p className="text-white text-lg">
          {loading ? "Loading..." : "Preparing your plan..."}
        </p>
      </motion.div>
    </div>
  );
}
