"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFirebase } from "@/components/firebase-provider";
import { doc, setDoc, getFirestore, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Loader2, ArrowLeft, Mail, Lock, User, Phone } from "lucide-react";
import Image, { StaticImageData } from "next/image";
import lumixlogo from "@/app/public/images/image.png";
import launchLogo from "@/app/public/images/launch.png";
import businessLogo from "@/app/public/images/business.png";
import enterpriseLogo from "@/app/public/images/enterprise.png";
import { motion, AnimatePresence } from "framer-motion";

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
  const { user, userData, loading, signIn, signUp, signInWithGoogle } =
    useFirebase();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processing, setProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("Processing...");
  const [googleProcessing, setGoogleProcessing] = useState(false);
  const [verifyingPaymentStatus, setVerifyingPaymentStatus] = useState(false);

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

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleProcessing(true);

    try {
      const user = await signInWithGoogle();

      // We need to get the latest user data from Firestore
      const db = getFirestore();
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      const latestUserData = userDoc.exists() ? userDoc.data() : null;

      // Now use the latest user data for redirection
      if (planParam) {
        redirectToStripePayment(user.uid, user.email || "", planParam);
      } else if (latestUserData?.hasPaid) {
        if (!latestUserData.completedQuestionnaire) {
          router.push("/questionnaire");
        } else {
          router.push("/dashboard");
        }
      } else {
        router.push("/pricing");
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to sign in with Google. Please try again."
      );
      setGoogleProcessing(false);
    }
  };

  // Function to handle password reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setProcessing(true);

    if (!email) {
      setError("Please enter your email address");
      setProcessing(false);
      return;
    }

    try {
      // Call our custom API endpoint instead of using Firebase directly
      const response = await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send password reset email");
      }

      setSuccess("Password reset email sent! Please check your inbox.");

      // Keep success message visible for a few seconds
      setTimeout(() => {
        setIsForgotPassword(false);
        setProcessing(false);
      }, 3000);
    } catch (error) {
      console.error("Password reset error:", error);

      let errorMessage =
        "Failed to send password reset email. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("user-not-found")) {
          errorMessage = "No account found with this email address.";
        } else if (error.message.includes("invalid-email")) {
          errorMessage = "Please enter a valid email address.";
        } else if (error.message.includes("network")) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
      setProcessing(false);
    }
  };

  // Function to check the latest payment status directly from Firestore
  const checkLatestPaymentStatus = async (userId: string) => {
    setVerifyingPaymentStatus(true);
    try {
      console.log("Checking latest payment status for user:", userId);
      const db = getFirestore();
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const latestUserData = userDoc.data();
        console.log("Latest user data from Firestore:", latestUserData);

        // Use the latest data from Firestore for redirection
        if (latestUserData.hasPaid) {
          if (!latestUserData.completedQuestionnaire) {
            console.log("Redirecting to questionnaire");
            router.push("/questionnaire");
          } else {
            console.log("Redirecting to dashboard");
            router.push("/dashboard");
          }
        } else {
          console.log("User has not paid, redirecting to pricing");
          router.push("/pricing");
        }
      } else {
        console.log("User document not found, redirecting to pricing");
        router.push("/pricing");
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
      // If there's an error, fall back to pricing page
      router.push("/pricing");
    } finally {
      setVerifyingPaymentStatus(false);
    }
  };

  // Redirect logic based on user state
  useEffect(() => {
    if (!loading && user && !processing && !verifyingPaymentStatus) {
      // User is authenticated, check if they're coming to sign in with a plan selection
      if (planParam) {
        // If a plan is specified in URL, redirect to Stripe
        redirectToStripePayment(user.uid, user.email || "", planParam);
      } else {
        // Otherwise, check the latest payment status directly from Firestore
        checkLatestPaymentStatus(user.uid);
      }
    }
  }, [loading, user, processing, planParam, verifyingPaymentStatus]);

  // Check if we should show registration form based on presence of plan parameter
  useEffect(() => {
    if (planParam) {
      setIsRegistering(true);
    }
  }, [planParam]);

  // Check for prefilled_email parameter in URL
  useEffect(() => {
    const prefilledEmail = searchParams.get("prefilled_email");
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setProcessing(true);
    setProcessingMessage("Processing...");

    try {
      if (isRegistering) {
        // Validate required fields
        if (!firstName || !lastName || !phoneNumber) {
          throw new Error("All fields are required for registration");
        }

        // Create the authentication user
        setProcessingMessage("Creating your account...");

        const newUser = await signUp(email, password, {
          firstName,
          lastName,
          phoneNumber,
        });

        // Setup user profile
        setProcessingMessage("Setting up your profile...");

        if (!newUser || !newUser.uid) {
          console.error("Invalid user structure:", newUser);
          throw new Error("Failed to create account. Please try again.");
        }

        const db = getFirestore();
        let extractedPlanType: string | null = planType || null;
        let extractedBillingCycle: string | null = billingCycle || null;
        let extractedSelectedPlan: string | null = planParam || null;

        // If no plan in URL, check sessionStorage
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
          }
        }

        const userDocData = {
          email: email,
          firstName,
          lastName,
          phoneNumber,
          hasPaid: false,
          completedQuestionnaire: false,
          fulfilled: false,
          createdAt: new Date().toISOString(),
          selectedPlan: extractedSelectedPlan || null,
          planType: extractedPlanType || null,
          billingCycle: extractedBillingCycle || null,
          emailVerified: true,
          verifiedAt: new Date().toISOString(),
        };

        await setDoc(doc(db, "users", newUser.uid), userDocData);

        // Redirect based on plan parameter
        if (planParam) {
          redirectToStripePayment(newUser.uid, email, planParam);
        } else {
          router.push("/pricing");
        }
      } else {
        // Sign in existing user
        setProcessingMessage("Signing in...");
        const userCredential = await signIn(email, password);

        if (!userCredential) {
          throw new Error("Failed to sign in. Please try again.");
        }

        // Access the user ID from the credential
        const userId = userCredential.uid;

        // Important: Check the user data directly from Firestore after sign-in
        const db = getFirestore();
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const latestUserData = userDoc.data();
          console.log(
            "Sign-in - Latest user data from Firestore:",
            latestUserData
          );

          // Direct routing based on latest data
          if (latestUserData.hasPaid) {
            if (!latestUserData.completedQuestionnaire) {
              console.log("Redirecting to questionnaire");
              router.push("/questionnaire");
            } else {
              console.log("Redirecting to dashboard");
              router.push("/dashboard");
            }
          } else {
            console.log("Redirecting to pricing (no payment)");
            router.push("/pricing");
          }
        } else {
          console.log("User document not found, redirecting to pricing");
          router.push("/pricing");
        }

        // Set processing to false to stop loading state if router doesn't navigate immediately
        setTimeout(() => {
          setProcessing(false);
        }, 1000);
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

  const slideUp = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
  };

  // Redirect to pricing if visitor directly hits the main URL without a plan or auth
  useEffect(() => {
    if (!loading && !user && !planParam && window.location.pathname === "/") {
      // Check if this is a logout action - keep this logic
      const fromLogout = searchParams.get("from") === "logout";
    }
  }, [loading, user, planParam, searchParams]);

  if (loading || processing || googleProcessing || verifyingPaymentStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center">
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
            {googleProcessing
              ? "Signing in with Google..."
              : verifyingPaymentStatus
              ? "Checking your account status..."
              : processingMessage}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0d0d0d]">
      {/* Left side - Branding and Benefits */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center bg-gradient-to-br from-[#0d0d0d] to-[#1a1a1a] p-12">
        <div className="max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
            <Image src={lumixlogo} alt="Lumix Logo" width={200} height={60} />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-300 text-lg mb-8"
          >
            Struggling to launch a website you love? Then we'll help grow your
            business. Agency service at a fraction of the price.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-[#F58327] flex items-center justify-center mr-3 mt-1">
                <svg
                  width="14"
                  height="10"
                  viewBox="0 0 14 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 5L5 9L13 1"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-gray-300">
                Professional website for your business
              </p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-[#F58327] flex items-center justify-center mr-3 mt-1">
                <svg
                  width="14"
                  height="10"
                  viewBox="0 0 14 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 5L5 9L13 1"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-gray-300">
                30-day money-back guarantee, no risk
              </p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-[#F58327] flex items-center justify-center mr-3 mt-1">
                <svg
                  width="14"
                  height="10"
                  viewBox="0 0 14 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 5L5 9L13 1"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-gray-300">
                Get set up in minutes, see results in days
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Mobile logo (only visible on mobile) */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Image src={lumixlogo} alt="Lumix Logo" width={200} height={56} />
          </div>

          <AnimatePresence mode="wait">
            {/* FORGOT PASSWORD VIEW */}
            {isForgotPassword ? (
              <motion.div
                key="forgot-password"
                initial="initial"
                animate="animate"
                exit="exit"
                variants={fadeIn}
                transition={{ duration: 0.3 }}
                className="bg-[#111111] rounded-xl p-8 shadow-lg border border-gray-800"
              >
                <button
                  onClick={() => setIsForgotPassword(false)}
                  className="text-gray-400 hover:text-white mb-6 flex items-center transition-colors"
                >
                  <ArrowLeft size={16} className="mr-1" />
                  <span>Back to sign in</span>
                </button>

                <h2 className="text-2xl font-bold text-white mb-2">
                  Reset your password
                </h2>
                <p className="text-gray-400 mb-6">
                  Enter your email address and we'll send you a link to reset
                  your password.
                </p>

                {error && (
                  <motion.div
                    className="mb-6 px-4 py-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {error}
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    className="mb-6 px-4 py-3 bg-green-900/30 border border-green-800 rounded-lg text-green-300"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {success}
                  </motion.div>
                )}

                <form onSubmit={handlePasswordReset} className="space-y-6">
                  <div>
                    <label
                      htmlFor="email-reset"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        id="email-reset"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#1a1a1a] text-white pl-10 pr-4 py-3 rounded-lg border border-gray-800 focus:ring-2 focus:ring-[#F58327] focus:border-transparent transition-all duration-200"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full flex justify-center items-center bg-[#F58327] hover:bg-[#e67016] text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F58327]"
                  >
                    {processing ? (
                      <div className="flex items-center">
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Sending...
                      </div>
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              // LOGIN OR REGISTER VIEW
              <motion.div
                key={isRegistering ? "register" : "signin"}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={fadeIn}
                transition={{ duration: 0.3 }}
                className="bg-[#111111] rounded-xl p-8 shadow-lg border border-gray-800"
              >
                <h2 className="text-2xl font-bold text-white mb-2">
                  {isRegistering ? "Create your account" : "Welcome back"}
                </h2>
                <div className="flex items-center mb-6">
                  {planParam && planIcons[planParam] && (
                    <div className="flex mr-2">
                      <Image
                        src={planIcons[planParam]}
                        alt={`Plan icon for ${planParam}`}
                        width={24}
                        height={24}
                        className="h-5 w-5 rounded-sm"
                      />
                    </div>
                  )}
                  <p className="text-gray-400">
                    {isRegistering && planParam
                      ? `Sign up for the ${
                          planType.charAt(0).toUpperCase() + planType.slice(1)
                        } ${
                          billingCycle.charAt(0).toUpperCase() +
                          billingCycle.slice(1)
                        } Plan`
                      : isRegistering
                      ? "Get started with your account"
                      : "Sign in to your dashboard"}
                  </p>
                </div>

                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      className="mb-6 px-4 py-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div>
                    <label
                      htmlFor="email-address"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-500" />
                      </div>
                      <input
                        id="email-address"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#1a1a1a] text-white pl-10 pr-4 py-3 rounded-lg border border-gray-800 focus:ring-2 focus:ring-[#F58327] focus:border-transparent transition-all duration-200"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-300"
                      >
                        Password
                      </label>
                      {!isRegistering && (
                        <button
                          type="button"
                          onClick={() => setIsForgotPassword(true)}
                          className="text-sm text-[#F58327] hover:text-[#e67016] transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-500" />
                      </div>
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
                        className="w-full bg-[#1a1a1a] text-white pl-10 pr-4 py-3 rounded-lg border border-gray-800 focus:ring-2 focus:ring-[#F58327] focus:border-transparent transition-all duration-200"
                        placeholder={
                          isRegistering ? "Create password" : "Enter password"
                        }
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {isRegistering && (
                      <motion.div
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        variants={slideUp}
                        className="space-y-5"
                      >
                        <div>
                          <label
                            htmlFor="first-name"
                            className="block text-sm font-medium text-gray-300 mb-2"
                          >
                            First Name
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                              id="first-name"
                              name="firstName"
                              type="text"
                              autoComplete="given-name"
                              required
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              className="w-full bg-[#1a1a1a] text-white pl-10 pr-4 py-3 rounded-lg border border-gray-800 focus:ring-2 focus:ring-[#F58327] focus:border-transparent transition-all duration-200"
                              placeholder="First name"
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="last-name"
                            className="block text-sm font-medium text-gray-300 mb-2"
                          >
                            Last Name
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <User className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                              id="last-name"
                              name="lastName"
                              type="text"
                              autoComplete="family-name"
                              required
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              className="w-full bg-[#1a1a1a] text-white pl-10 pr-4 py-3 rounded-lg border border-gray-800 focus:ring-2 focus:ring-[#F58327] focus:border-transparent transition-all duration-200"
                              placeholder="Last name"
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="phone-number"
                            className="block text-sm font-medium text-gray-300 mb-2"
                          >
                            Phone Number
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Phone className="h-5 w-5 text-gray-500" />
                            </div>
                            <input
                              id="phone-number"
                              name="phoneNumber"
                              type="tel"
                              autoComplete="tel"
                              required
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              className="w-full bg-[#1a1a1a] text-white pl-10 pr-4 py-3 rounded-lg border border-gray-800 focus:ring-2 focus:ring-[#F58327] focus:border-transparent transition-all duration-200"
                              placeholder="Phone number"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* TOS Agreement with checkbox */}
                  <div className="pt-2">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="terms"
                          name="terms"
                          type="checkbox"
                          required
                          className="h-4 w-4 text-[#F58327] focus:ring-[#F58327] border-gray-600 rounded"
                        />
                      </div>
                      <div className="ml-3">
                        <label
                          htmlFor="terms"
                          className="text-xs text-gray-400"
                        >
                          By {isRegistering ? "registering" : "signing in"}, I
                          agree to WebDash's{" "}
                          <a
                            href="https://webdash.io/tos"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#F58327] hover:text-[#e67016] transition-colors underline"
                          >
                            Terms of Service
                          </a>
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={processing || verifyingPaymentStatus}
                    className="w-full flex justify-center items-center bg-[#F58327] hover:bg-[#e67016] text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F58327]"
                  >
                    {processing || verifyingPaymentStatus ? (
                      <div className="flex items-center">
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Processing...
                      </div>
                    ) : isRegistering ? (
                      "Create Account"
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
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
                      className="text-[#F58327] hover:text-[#e67016] text-sm font-medium transition-colors"
                    >
                      Already have an account? Sign in
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsRegistering(true)}
                      className="text-[#F58327] hover:text-[#e67016] text-sm font-medium transition-colors"
                    >
                      Don't have an account? Register now
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
