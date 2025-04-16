"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFirebase } from "@/components/firebase-provider";
import { doc, setDoc, getFirestore } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import Image, { StaticImageData } from "next/image";
import lumixlogo from "@/app/public/images/image.png";
import launchLogo from "@/app/public/images/launch.png";
import businessLogo from "@/app/public/images/business.png";
import enterpriseLogo from "@/app/public/images/enterprise.png";

// Define your Stripe payment link
const STRIPE_PAYMENT_LINK =
  process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ||
  "https://buy.stripe.com/your_payment_link";

// Map of plan types to their stripe payment links
const STRIPE_PAYMENT_LINKS: Record<string, string> = {
  "launch-yearly": "https://buy.stripe.com/fZecQy9Oz51ScOQdR2",
  "launch-monthly": "https://buy.stripe.com/14k4k2e4P1PGeWY5kt",
  "business-yearly": "https://buy.stripe.com/9AQdUC3qbamcbKM14f",
  "business-monthly": "https://buy.stripe.com/4gw9EmbWHeCs3eg7sA",
  "enterprise-yearly": "https://buy.stripe.com/5kAbMu4uf3XO0247sC",
  "enterprise-monthly": "https://buy.stripe.com/14kdUC3qb8e4168bIP",
};

const planIcons: Record<string, StaticImageData> = {
  "launch-yearly": launchLogo,
  "launch-monthly": launchLogo,
  "business-yearly": businessLogo,
  "business-monthly": businessLogo,
  "enterprise-yearly": enterpriseLogo,
  "enterprise-monthly": enterpriseLogo,
};
export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userData, loading, signIn, signUp } = useFirebase();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("Processing...");

  // Check for plan parameter in URL
  const planParam = searchParams.get("plan");

  // Extract plan details for display if needed
  const planParts = planParam ? planParam.split("-") : [];
  const planType = planParts[0] || "";
  const billingCycle = planParts[1] || "";

  // Function to redirect to Stripe payment
  const redirectToStripePayment = (
    uid: string,
    email: string,
    plan?: string | null
  ) => {
    // If a specific plan was selected and it's not null, use that link
    if (plan && STRIPE_PAYMENT_LINKS[plan]) {
      const paymentUrl = new URL(STRIPE_PAYMENT_LINKS[plan]);
      paymentUrl.searchParams.append("uid", uid);
      paymentUrl.searchParams.append("email", email);
      paymentUrl.searchParams.append("plan", plan);
      window.location.href = paymentUrl.toString();
    } else {
      // Fall back to default payment link
      const paymentUrl = new URL(STRIPE_PAYMENT_LINK);
      paymentUrl.searchParams.append("uid", uid);
      paymentUrl.searchParams.append("email", email);
      window.location.href = paymentUrl.toString();
    }
  };

  // Redirect logic based on user state
  useEffect(() => {
    if (!loading && user && !processing) {
      // User is authenticated (and we're not in the middle of registration)
      if (!userData?.hasPaid) {
        if (planParam) {
          // If a plan is specified in URL, redirect to Stripe
          redirectToStripePayment(user.uid, user.email || "", planParam);
        } else {
          // Otherwise direct to pricing page to select a plan
          router.push("/pricing");
        }
      } else if (!userData?.completedQuestionnaire) {
        // User has paid but not completed questionnaire
        router.push("/questionnaire");
      } else {
        // User has completed everything, go to dashboard
        router.push("/dashboard");
      }
    }
  }, [loading, user, userData, router, processing, planParam]);

  // Check if we should show registration form based on presence of plan parameter
  useEffect(() => {
    if (planParam) {
      setIsRegistering(true);
    }
  }, [planParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Normal authentication flow
    setProcessing(true);
    setProcessingMessage("Processing...");

    try {
      if (isRegistering) {
        // Register new user
        if (!firstName || !lastName || !phoneNumber) {
          throw new Error("All fields are required for registration");
        }

        console.log("Starting registration process...");
        setProcessingMessage("Creating your account...");

        // Step 1: Create the authentication user
        const newUser = await signUp(email, password, {
          firstName,
          lastName,
          phoneNumber,
        });

        console.log("Auth user created successfully:", newUser.uid);

        // Instead of verification, directly set up the user profile
        setProcessingMessage("Setting up your profile...");

        const db = getFirestore();
        let extractedPlanType: string | null = planType || null;
        let extractedBillingCycle: string | null = billingCycle || null;
        let extractedSelectedPlan: string | null = planParam || null;

        // If no plan in URL, check sessionStorage (for plans redirect flow)
        if (!extractedSelectedPlan) {
          const storedPlan =
            typeof window !== "undefined"
              ? sessionStorage.getItem("selectedPlan")
              : null;

          if (storedPlan) {
            extractedSelectedPlan = storedPlan;
            const parts = storedPlan.split("-");
            extractedPlanType = parts.length > 0 ? parts[0] : null;
            extractedBillingCycle = parts.length > 1 ? parts[1] : null;
            console.log(
              `Found plan in sessionStorage: ${extractedSelectedPlan} (${extractedPlanType}, ${extractedBillingCycle})`
            );
          }
        }

        console.log(
          `Creating user with plan: ${extractedSelectedPlan}, type: ${extractedPlanType}, cycle: ${extractedBillingCycle}`
        );

        const userDocData = {
          email: email,
          firstName,
          lastName,
          phoneNumber,
          hasPaid: false,
          completedQuestionnaire: false,
          createdAt: new Date().toISOString(),
          selectedPlan: extractedSelectedPlan || null,
          planType: extractedPlanType || null,
          billingCycle: extractedBillingCycle || null,
          emailVerified: true, // Auto-verify email for now
        };

        await setDoc(doc(db, "users", newUser.uid), userDocData);
        console.log("Firestore document created successfully");

        // Redirect based on plan parameter
        if (planParam) {
          console.log("Redirecting to Stripe payment");
          redirectToStripePayment(newUser.uid, email, planParam);
        } else {
          console.log("Redirecting to pricing page");
          router.push("/pricing");
        }
      } else {
        // Sign in existing user
        setProcessingMessage("Signing in...");
        const userCredential = await signIn(email, password);

        // Skip verification and directly handle redirection in the useEffect
        setProcessing(false);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred during authentication"
      );
      setProcessing(false);
    }
  };

  // Animation variants
  const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  // Redirect to pricing if visitor directly hits the main URL without a plan or auth
  // We're modifying this as per new requirements to keep users on the sign-in page
  useEffect(() => {
    if (!loading && !user && !planParam && window.location.pathname === "/") {
      // Check if this is a logout action - keep this logic
      const fromLogout = searchParams.get("from") === "logout";

      // We're removing the auto-redirect to pricing since we now want users
      // to be able to register directly on the sign-in page
    }
  }, [loading, user, planParam, searchParams]);

  if (loading || processing) {
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
          <p className="text-white text-lg">{processingMessage}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-center mb-4">
          <Image src={lumixlogo} alt="Lumix Logo" width={100} height={40} />
        </div>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            {isRegistering ? "Create your account" : "Sign in to your account"}
          </h2>
          <div className="flex flex-row justify-center items-center mt-2">
            {planParam && planIcons[planParam] && (
              <div className="flex mr-2 mt-2">
                <Image
                  src={planIcons[planParam]}
                  alt={`Plan icon for ${planParam}`}
                  width={30}
                  height={30}
                  className="h-6 w-6 rounded-sm"
                />
              </div>
            )}
            <p className="flex mt-2  text-gray-400 ">
              {isRegistering && planParam
                ? `Register for the ${
                    planType.charAt(0).toUpperCase() + planType.slice(1)
                  } ${
                    billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)
                  } Plan`
                : isRegistering
                ? "Register to start your website project"
                : "Sign in to access your website project dashboard"}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              className="mb-6 px-4 py-3 border-l-4 border-red-500 bg-black"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-red-400">{error}</div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={isRegistering ? "register" : "signin"}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={fadeIn}
            transition={{ duration: 0.3 }}
          >
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="email-address"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-gray-800 px-0 py-3 text-white placeholder-gray-500 focus:border-[#F58327] focus:outline-none transition-colors duration-200 appearance-none !bg-transparent"
                    placeholder="Enter your email"
                    style={{ backgroundColor: "transparent" }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-300 mb-1"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={
                      isRegistering ? "new-password" : "current-password"
                    }
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-gray-800 px-0 py-3 text-white placeholder-gray-500 focus:border-[#F58327] focus:outline-none transition-colors duration-200 appearance-none !bg-transparent"
                    placeholder="Enter your password"
                    style={{ backgroundColor: "transparent" }}
                  />
                </div>

                {isRegistering && (
                  <>
                    <div>
                      <label
                        htmlFor="first-name"
                        className="block text-sm font-medium text-gray-300 mb-1"
                      >
                        First Name
                      </label>
                      <input
                        id="first-name"
                        name="firstName"
                        type="text"
                        autoComplete="given-name"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-transparent border-b-2 border-gray-800 px-0 py-3 text-white placeholder-gray-500 focus:border-[#F58327] focus:outline-none transition-colors duration-200 appearance-none !bg-transparent"
                        placeholder="Enter your first name"
                        style={{ backgroundColor: "transparent" }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="last-name"
                        className="block text-sm font-medium text-gray-300 mb-1"
                      >
                        Last Name
                      </label>
                      <input
                        id="last-name"
                        name="lastName"
                        type="text"
                        autoComplete="family-name"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-transparent border-b-2 border-gray-800 px-0 py-3 text-white placeholder-gray-500 focus:border-[#F58327] focus:outline-none transition-colors duration-200 appearance-none !bg-transparent"
                        placeholder="Enter your last name"
                        style={{ backgroundColor: "transparent" }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="phone-number"
                        className="block text-sm font-medium text-gray-300 mb-1"
                      >
                        Phone Number
                      </label>
                      <input
                        id="phone-number"
                        name="phoneNumber"
                        type="tel"
                        autoComplete="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full bg-transparent border-b-2 border-gray-800 px-0 py-3 text-white placeholder-gray-500 focus:border-[#F58326] focus:outline-none transition-colors duration-200 appearance-none !bg-transparent"
                        placeholder="Enter your phone number"
                        style={{ backgroundColor: "transparent" }}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={processing}
                  className="cursor-pointer relative flex items-center justify-center w-full bg-[#F58327] text-white text-lg rounded-full px-8 py-3 min-h-[54px] disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200 hover:bg-[#e67016]"
                >
                  {processing ? (
                    <div className="flex items-center">
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </div>
                  ) : isRegistering ? (
                    "Register"
                  ) : (
                    "Sign in"
                  )}
                </button>
              </div>

              <div className="text-center pt-4">
                {isRegistering ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(false);
                      // Remove plan parameter from URL when switching to sign in
                      if (planParam) {
                        router.push("/");
                      }
                    }}
                    className="cursor-pointer text-[#F58327] hover:text-[#e67016] transition-colors duration-200"
                  >
                    Already have an account? Sign in
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsRegistering(true)}
                    className="cursor-pointer text-[#F58327] hover:text-[#e67016] transition-colors duration-200"
                  >
                    Don't have an account? Register now
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
