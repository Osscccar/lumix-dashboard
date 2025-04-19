"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFirebase } from "@/components/firebase-provider";
import { motion } from "framer-motion";
import { Check, X, Loader2 } from "lucide-react";
import { doc, updateDoc, getFirestore } from "firebase/firestore";

// Map of plan types to their stripe payment links
const STRIPE_PAYMENT_LINKS: Record<string, string> = {
  "launch-yearly": "https://buy.stripe.com/fZecQy9Oz51ScOQdR2",
  "launch-monthly": "https://buy.stripe.com/14k4k2e4P1PGeWY5kt",
  "business-yearly": "https://buy.stripe.com/9AQdUC3qbamcbKM14f",
  "business-monthly": "https://buy.stripe.com/4gw9EmbWHeCs3eg7sA",
  "enterprise-yearly": "https://buy.stripe.com/5kAbMu4uf3XO0247sC",
  "enterprise-monthly": "https://buy.stripe.com/14kdUC3qb8e4168bIP",
};

// Features that appear in "Included in all plans"
const baseFeatures = [
  "Built-for-you website / online store",
  "Personalized design & copy",
  "Ready in just 5 days",
  "0% fees on sales or bookings",
  "Easy-to-use editor",
  "Secure hosting & SSL",
  "Fast loading speeds to rank on Google",
  "Connect your current domain or buy one",
  {
    text: "Professional email address",
    subtext: "(Eg. sales@yourwebsite.com)",
  },
];

// Additional features specific to each plan
const launchFeatures: string[] = [];

const businessFeatures = [
  "Advanced SEO to rank high on Google",
  { text: "FREE custom domain", subtext: "(Eg. www.yourwebsite.com)" },
  {
    text: "3 professional email addresses",
    subtext: "(Eg. sales@yourwebsite.com)",
  },
  "3rd party integrations on your website to convert visitors into customers such as: Live chat support, booking forms, advanced designs & much more.",
  "VIP support and extra fast updates",
];

const enterpriseFeatures = [
  "Advanced e-commerce capabilities",
  "Full webstore built for you",
  "Unlimited products",
  "Unlimited edits",
  "Sell subscriptions & digital products",
  "Enhancing marketing integrations",
  "Complex animations and design",
];

export default function PricingPage() {
  const router = useRouter();
  const { user, loading } = useFirebase();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // If no user is logged in, redirect to sign-in page
    if (!loading && !user) {
      router.push("/");
    }
  }, [loading, user, router]);

  const handleSelectPlan = (plan: string) => {
    const planKey = `${plan}-${billingCycle}`;

    if (user && STRIPE_PAYMENT_LINKS[planKey]) {
      setIsProcessing(true);

      // Store plan details in the database before redirecting
      const db = getFirestore();
      const userRef = doc(db, "users", user.uid);

      // Update plan information in Firebase
      updateDoc(userRef, {
        selectedPlan: planKey,
        planType: plan,
        billingCycle: billingCycle,
        updatedAt: new Date().toISOString(),
      })
        .then(() => {
          console.log(`Updated user plan in database: ${planKey}`);

          // Create the payment URL with user data
          const paymentUrl = new URL(STRIPE_PAYMENT_LINKS[planKey]);
          paymentUrl.searchParams.append("uid", user.uid);
          paymentUrl.searchParams.append("email", user.email || "");
          paymentUrl.searchParams.append("plan", planKey);

          // Redirect to Stripe payment
          window.location.href = paymentUrl.toString();
        })
        .catch((error) => {
          console.error("Error updating plan:", error);
          setIsProcessing(false);
          // Continue with redirect even if update fails
          const paymentUrl = new URL(STRIPE_PAYMENT_LINKS[planKey]);
          paymentUrl.searchParams.append("uid", user.uid);
          paymentUrl.searchParams.append("email", user.email || "");
          paymentUrl.searchParams.append("plan", planKey);
          window.location.href = paymentUrl.toString();
        });
    }
  };

  // Monthly prices - CORRECT PRICES
  const monthlyPrices = {
    launch: "$29",
    business: "$59",
    enterprise: "$99",
  };

  // Yearly prices converted to monthly cost (25% discount applied)
  const yearlyPricesAsMonthly = {
    launch: "$21.42", // $257/12 ≈ $21.42, reflects 25% discount from $29
    business: "$44.25", // $531/12 ≈ $44.25, reflects 25% discount from $59
    enterprise: "$74.25", // $891/12 ≈ $74.25, reflects 25% discount from $99
  };

  // Yearly prices total
  const yearlyPricesTotal = {
    launch: "$257",
    business: "$531",
    enterprise: "$891",
  };

  const setupFees = {
    launch: "$99",
    business: "$149",
    enterprise: "$199",
  };

  const originalSetupFees = {
    launch: "$400",
    business: "$500",
    enterprise: "$600",
  };

  const billingText =
    billingCycle === "monthly" ? "/month" : "/month, billed annually";
  const saveText =
    billingCycle === "yearly" ? "Save 25% with annual billing" : "";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#F58327] mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white px-4 py-12">
      <div className="max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Choose Your Plan
          </h1>
          <p className="mt-4 text-gray-400 max-w-3xl mx-auto">
            Select the perfect plan to bring your website to life. All plans
            include top-notch design and functionality tailored to your needs.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex bg-gray-800 rounded-full p-1.5 border border-gray-700/50 shadow-xl">
            <button
              className={`cursor-pointer px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                billingCycle === "monthly"
                  ? "bg-[#F58327] text-white shadow-lg"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setBillingCycle("monthly")}
            >
              Monthly
            </button>
            <button
              className={`cursor-pointer px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                billingCycle === "yearly"
                  ? "bg-[#F58327] text-white shadow-lg"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => setBillingCycle("yearly")}
            >
              Yearly
            </button>
          </div>

          {saveText && (
            <p className="text-[#F58327] mt-3 text-sm font-medium">
              {saveText}
            </p>
          )}
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mt-8">
          {/* Launch Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative bg-black border border-gray-800 rounded-xl p-6 flex flex-col h-full overflow-hidden shadow-xl hover:border-[#F58327]/50 transition-all duration-300"
          >
            {/* Plan Badge */}
            <div className="absolute top-4 right-4">
              <div className="bg-gray-800 text-[#F58327] text-xs font-semibold px-2.5 py-1 rounded-full">
                Launch
              </div>
            </div>

            <div className="flex justify-center mb-6">
              <div className="bg-[#F58327]/20 p-3.5 rounded-full shadow-lg">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                    fill="#F58327"
                  />
                </svg>
              </div>
            </div>

            <h3 className="text-center font-medium text-lg mb-1">
              Launch Plan
            </h3>

            <div className="text-center mb-6">
              <div className="flex items-center justify-center">
                <span className="text-gray-400 text-lg">$</span>
                <span className="text-[#F58327] text-5xl font-bold mx-1">
                  {billingCycle === "monthly"
                    ? monthlyPrices.launch.replace("$", "")
                    : yearlyPricesAsMonthly.launch.replace("$", "")}
                </span>
              </div>
              <div className="text-gray-400 text-sm mt-1">{billingText}</div>
              {billingCycle === "yearly" && (
                <div className="text-xs text-gray-400 mt-1">
                  {yearlyPricesTotal.launch} total
                </div>
              )}
            </div>

            <div className="border-t border-gray-800 py-3 mb-6 text-center">
              <div className="flex items-center justify-center">
                <span className="line-through text-gray-500 mr-2">
                  {originalSetupFees.launch}
                </span>
                <span className="text-white">{setupFees.launch} setup fee</span>
              </div>
            </div>

            <button
              onClick={() => handleSelectPlan("launch")}
              disabled={isProcessing}
              className="cursor-pointer bg-[#F58327] hover:bg-[#e67016] transition-colors duration-300 text-white py-3.5 px-4 rounded-full font-medium mb-6 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </div>
              ) : (
                `Choose LAUNCH`
              )}
            </button>

            <h4 className="font-medium mb-4 text-[#F58327]">
              Included in all plans:
            </h4>
            <div className="space-y-3 mt-2 flex-grow">
              {baseFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-start">
                  <Check className="h-5 w-5 text-[#F58327] mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm text-gray-300">
                      {typeof feature === "string" ? feature : feature.text}
                    </span>
                    {typeof feature !== "string" && feature.subtext && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {feature.subtext}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Business Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="relative bg-black border border-gray-800 rounded-xl p-6 flex flex-col h-full overflow-hidden shadow-xl hover:border-[#F58327]/50 transition-all duration-300"
          >
            {/* Plan Badge */}
            <div className="absolute top-4 right-4">
              <div className="bg-gray-800 text-[#F58327] text-xs font-semibold px-2.5 py-1 rounded-full">
                Business
              </div>
            </div>

            <div className="flex justify-center mb-6">
              <div className="bg-[#F58327]/20 p-3.5 rounded-full shadow-lg">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20 7H16V5C16 3.9 15.1 3 14 3H10C8.9 3 8 3.9 8 5V7H4C2.9 7 2 7.9 2 9V20C2 21.1 2.9 22 4 22H20C21.1 22 22 21.1 22 20V9C22 7.9 21.1 7 20 7ZM10 5H14V7H10V5Z"
                    fill="#F58327"
                  />
                </svg>
              </div>
            </div>

            <h3 className="text-center font-medium text-lg mb-1">
              Business Plan
            </h3>

            <div className="text-center mb-6">
              <div className="flex items-center justify-center">
                <span className="text-gray-400 text-lg">$</span>
                <span className="text-[#F58327] text-5xl font-bold mx-1">
                  {billingCycle === "monthly"
                    ? monthlyPrices.business.replace("$", "")
                    : yearlyPricesAsMonthly.business.replace("$", "")}
                </span>
              </div>
              <div className="text-gray-400 text-sm mt-1">{billingText}</div>
              {billingCycle === "yearly" && (
                <div className="text-xs text-gray-400 mt-1">
                  {yearlyPricesTotal.business} total
                </div>
              )}
            </div>

            <div className="border-t border-gray-800 py-3 mb-6 text-center">
              <div className="flex items-center justify-center">
                <span className="line-through text-gray-500 mr-2">
                  {originalSetupFees.business}
                </span>
                <span className="text-white">
                  {setupFees.business} setup fee
                </span>
              </div>
            </div>

            <button
              onClick={() => handleSelectPlan("business")}
              disabled={isProcessing}
              className="cursor-pointer bg-[#F58327] hover:bg-[#e67016] transition-colors duration-300 text-white py-3.5 px-4 rounded-full font-medium mb-6 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </div>
              ) : (
                `Choose BUSINESS`
              )}
            </button>

            <h4 className="font-medium mb-4 text-[#F58327]">
              Everything in Launch, and:
            </h4>
            <div className="space-y-3 mt-2 flex-grow">
              {businessFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-start">
                  <Check className="h-5 w-5 text-[#F58327] mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm text-gray-300">
                      {typeof feature === "string" ? feature : feature.text}
                    </span>
                    {typeof feature !== "string" && feature.subtext && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {feature.subtext}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Enterprise Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="relative bg-black border border-gray-800 rounded-xl p-6 flex flex-col h-full overflow-hidden shadow-xl hover:border-[#F58327]/50 transition-all duration-300"
          >
            {/* Plan Badge */}
            <div className="absolute top-4 right-4">
              <div className="bg-gray-800 text-[#F58327] text-xs font-semibold px-2.5 py-1 rounded-full">
                Enterprise
              </div>
            </div>

            <div className="flex justify-center mb-6">
              <div className="bg-[#F58327]/20 p-3.5 rounded-full shadow-lg">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 7V3H2V21H22V7H12ZM6 19H4V17H6V19ZM6 15H4V13H6V15ZM6 11H4V9H6V11ZM6 7H4V5H6V7ZM10 19H8V17H10V19ZM10 15H8V13H10V15ZM10 11H8V9H10V11ZM10 7H8V5H10V7ZM20 19H12V17H14V15H12V13H14V11H12V9H20V19ZM18 11H16V13H18V11ZM18 15H16V17H18V15Z"
                    fill="#F58327"
                  />
                </svg>
              </div>
            </div>

            <h3 className="text-center font-medium text-lg mb-1">
              Enterprise Plan
            </h3>

            <div className="text-center mb-6">
              <div className="flex items-center justify-center">
                <span className="text-gray-400 text-lg">$</span>
                <span className="text-[#F58327] text-5xl font-bold mx-1">
                  {billingCycle === "monthly"
                    ? monthlyPrices.enterprise.replace("$", "")
                    : yearlyPricesAsMonthly.enterprise.replace("$", "")}
                </span>
              </div>
              <div className="text-gray-400 text-sm mt-1">{billingText}</div>
              {billingCycle === "yearly" && (
                <div className="text-xs text-gray-400 mt-1">
                  {yearlyPricesTotal.enterprise} total
                </div>
              )}
            </div>

            <div className="border-t border-gray-800 py-3 mb-6 text-center">
              <div className="flex items-center justify-center">
                <span className="line-through text-gray-500 mr-2">
                  {originalSetupFees.enterprise}
                </span>
                <span className="text-white">
                  {setupFees.enterprise} setup fee
                </span>
              </div>
            </div>

            <button
              onClick={() => handleSelectPlan("enterprise")}
              disabled={isProcessing}
              className="cursor-pointer bg-[#F58327] hover:bg-[#e67016] transition-colors duration-300 text-white py-3.5 px-4 rounded-full font-medium mb-6 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Processing...
                </div>
              ) : (
                `Choose ENTERPRISE`
              )}
            </button>

            <h4 className="font-medium mb-4 text-[#F58327]">
              Everything in Business, and:
            </h4>
            <div className="space-y-3 mt-2 flex-grow">
              {enterpriseFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-start">
                  <Check className="h-5 w-5 text-[#F58327] mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm text-gray-300">
                      {typeof feature === "string" ? feature : feature.text}
                    </span>
                    {typeof feature !== "string" && feature.subtext && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {feature.subtext}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
