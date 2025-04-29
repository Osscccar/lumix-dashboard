"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFirebase } from "@/components/firebase-provider";
import { doc, setDoc, getFirestore, getDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
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
    <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d] px-4 py-12 sm:px-6 lg:px-8">
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
            <p className="flex mt-2 text-gray-400">
              {isRegistering && planParam
                ? `Register for the ${
                    planType.charAt(0).toUpperCase() + planType.slice(1)
                  } ${
                    billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)
                  } Plan`
                : isRegistering
                ? "Register to begin the onboarding process"
                : "Sign in to access your client dashboard"}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              className="mb-6 px-4 py-3 border-l-4 border-red-500 bg-[#0d0d0d]"
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
            {/* Google Sign In Button */}
            {/* <div className="mb-5">
              <button
                onClick={handleGoogleSignIn}
                className="w-full cursor-pointer flex items-center justify-center bg-white text-gray-800 border border-gray-300 rounded-full px-4 py-3 font-medium hover:bg-gray-50 transition-colors"
              >
                <Image
                  src="/images/google.svg"
                  alt="Google logo"
                  width={20}
                  height={20}
                  className="mr-3"
                />
                {isRegistering
                  ? "Sign up with Google"
                  : "Sign in with Google"}
              </button>
            </div>
            */}

            {/* Divider 
            <div className="flex items-center mb-5">
              <div className="flex-1 h-px bg-gray-800"></div>
              <span className="px-3 text-sm text-gray-400">
                or continue with email
              </span>
              <div className="flex-1 h-px bg-gray-800"></div>
            </div>
            */}

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

              {/* TOS Disclaimer */}
              <div className="pt-2">
                <p className="text-gray-400 text-xs text-center">
                  By {isRegistering ? "registering" : "signing in"}, you agree
                  to Lumix Digital's{" "}
                  <a
                    href="https://lumixdigital.com.au/tos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#F58327] hover:text-[#e67016] transition-colors underline"
                  >
                    Terms of Service
                  </a>
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={processing || verifyingPaymentStatus}
                  className="cursor-pointer relative flex items-center justify-center w-full bg-[#F58327] text-white text-lg rounded-full px-8 py-3 min-h-[54px] disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200 hover:bg-[#e67016]"
                >
                  {processing || verifyingPaymentStatus ? (
                    <div className="flex items-center">
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </div>
                  ) : isRegistering ? (
                    "Register with Email"
                  ) : (
                    "Sign in with Email"
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
