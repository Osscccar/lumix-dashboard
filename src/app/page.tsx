"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFirebase } from "@/components/firebase-provider";
import { doc, setDoc, getFirestore, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ShieldCheck, Mail } from "lucide-react";
import Image, { StaticImageData } from "next/image";
import lumixlogo from "@/app/public/images/image.png";
import launchLogo from "@/app/public/images/launch.png";
import businessLogo from "@/app/public/images/business.png";
import enterpriseLogo from "@/app/public/images/enterprise.png";
import googleLogo from "@/app/public/images/google.svg";

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

  // 2FA states
  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const verificationInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check for plan parameter in URL
  const planParam = searchParams.get("plan");

  // Extract plan details for display if needed
  const planParts = planParam ? planParam.split("-") : [];
  const planType = planParts[0] || "";
  const billingCycle = planParts[1] || "";

  // Initialize verification refs array
  useEffect(() => {
    // Initialize the refs array with enough slots
    verificationInputRefs.current = Array(6).fill(null);
  }, []);

  // Handle input change for verification code
  const handleVerificationCodeChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);

      // Auto-focus next input
      if (value && index < 5) {
        verificationInputRefs.current[index + 1]?.focus();
      }
    }
  };

  // Handle paste for verification code
  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    if (pastedData.length <= 6) {
      // Fill in as many characters as we got from the clipboard
      const newCode = [...verificationCode];
      for (let i = 0; i < pastedData.length && i < 6; i++) {
        if (/^\d$/.test(pastedData[i])) {
          newCode[i] = pastedData[i];
        }
      }
      setVerificationCode(newCode);

      // Focus the next empty input or the last one if all filled
      const nextEmptyIndex = newCode.findIndex((digit) => digit === "");
      if (nextEmptyIndex !== -1) {
        verificationInputRefs.current[nextEmptyIndex]?.focus();
      } else {
        verificationInputRefs.current[5]?.focus();
      }
    }
  };

  // Handle key down for verification code
  const handleVerificationKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      // Move to previous input when backspace is pressed on an empty input
      verificationInputRefs.current[index - 1]?.focus();
    }
  };

  // Function to send verification code
  const sendVerificationCode = async (userEmail: string) => {
    try {
      const response = await fetch("/api/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send verification code");
      }

      setVerificationEmail(userEmail);
      return true;
    } catch (error) {
      console.error("Error sending verification code:", error);
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
      return false;
    }
  };

  // Function to verify code
  const verifyCode = async (userEmail: string, code: string) => {
    try {
      const response = await fetch("/api/send-verification", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify code");
      }

      return true;
    } catch (error) {
      console.error("Error verifying code:", error);
      setError(
        error instanceof Error ? error.message : "Invalid verification code"
      );
      return false;
    }
  };

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
          router.push("/questionnaire-choice"); // Changed this to questionnaire-choice
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

  // Handle resend verification code
  const handleResendCode = async () => {
    setProcessing(true);
    await sendVerificationCode(verificationEmail);
    setProcessing(false);
  };

  // Complete registration after successful verification
  const completeRegistration = async (userId: string) => {
    try {
      setProcessingMessage("Setting up your profile...");

      // Check if we have a valid user ID
      if (!userId) {
        console.error("Invalid user ID:", userId);
        throw new Error("Invalid user data. Please try again.");
      }

      console.log("Completing registration for user:", userId);

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
        email: verificationEmail,
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

      // Use the userId directly
      await setDoc(doc(db, "users", userId), userDocData);

      // Reset states
      setShowVerification(false);
      setIsVerifying(false);
      setTempUserId(null);

      // Redirect based on plan parameter
      if (planParam) {
        redirectToStripePayment(userId, verificationEmail, planParam);
      } else {
        router.push("/pricing");
      }
    } catch (error) {
      console.error("Error completing registration:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to complete registration"
      );
      setIsVerifying(false);
      setProcessing(false);
    }
  };

  // Handle verification code submission
  const handleVerifyCode = async () => {
    setIsVerifying(true);
    setError("");

    const code = verificationCode.join("");

    if (code.length !== 6) {
      setError("Please enter all 6 digits of the verification code");
      setIsVerifying(false);
      return;
    }

    try {
      const verified = await verifyCode(verificationEmail, code);

      if (!verified) {
        throw new Error("Invalid verification code");
      }

      // If we're registering and have a user ID
      if (isRegistering && tempUserId) {
        console.log("Verification successful, completing registration");
        console.log("Using user ID:", tempUserId);

        await completeRegistration(tempUserId);
      } else if (!isRegistering) {
        // For sign in, we already have the user authenticated, just proceed
        setShowVerification(false);
        setProcessing(false);
        setIsVerifying(false);
      } else {
        // No user ID but we're registering - this shouldn't happen
        console.error("Missing user ID for registration");
        setError("Registration data not found. Please try again.");
        setIsVerifying(false);
      }
    } catch (error) {
      console.error("Verification error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to verify code"
      );
      setIsVerifying(false);
    }
  };

  // Redirect logic based on user state
  useEffect(() => {
    if (!loading && user && !processing && !showVerification) {
      // User is authenticated (and we're not in the middle of verification)
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
  }, [
    loading,
    user,
    userData,
    router,
    processing,
    planParam,
    showVerification,
  ]);

  // Check if we should show registration form based on presence of plan parameter
  useEffect(() => {
    if (planParam) {
      setIsRegistering(true);
    }
  }, [planParam]);

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

        // Step 1: Create the authentication user
        setProcessingMessage("Creating your account...");

        const newUser = await signUp(email, password, {
          firstName,
          lastName,
          phoneNumber,
        });

        // Store the user ID
        if (newUser && newUser.uid) {
          setTempUserId(newUser.uid);
        } else {
          console.error("Invalid user structure:", newUser);
          throw new Error("Failed to create account. Please try again.");
        }

        // Send verification code and show verification UI
        const sent = await sendVerificationCode(email);
        if (!sent) {
          throw new Error("Failed to send verification code");
        }

        setVerificationEmail(email);
        setShowVerification(true);
        setProcessing(false);
      } else {
        // Sign in existing user
        setProcessingMessage("Signing in...");
        const userCredential = await signIn(email, password);

        // Send verification code for 2FA
        const sent = await sendVerificationCode(email);
        if (!sent) {
          throw new Error("Failed to send verification code");
        }

        setVerificationEmail(email);
        setShowVerification(true);
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

  // Modal animation variants
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  // Redirect to pricing if visitor directly hits the main URL without a plan or auth
  useEffect(() => {
    if (!loading && !user && !planParam && window.location.pathname === "/") {
      // Check if this is a logout action - keep this logic
      const fromLogout = searchParams.get("from") === "logout";
    }
  }, [loading, user, planParam, searchParams]);

  // Focus on first input for verification code
  useEffect(() => {
    if (showVerification && verificationInputRefs.current[0]) {
      setTimeout(() => {
        verificationInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [showVerification]);

  if (loading || (processing && !showVerification) || googleProcessing) {
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
            {googleProcessing ? "Signing in with Google..." : processingMessage}
          </p>
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

        {/* Verification Modal */}
        <AnimatePresence>
          {showVerification && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-xl p-6 w-full max-w-md relative"
                variants={modalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="text-center mb-5">
                  <div className="flex justify-center mb-4">
                    <div className="bg-blue-50 p-3 rounded-full">
                      <ShieldCheck className="h-8 w-8 text-[#F58327]" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Authenticate Your Account
                  </h2>
                  <p className="text-gray-600 mt-2 text-sm">
                    Protecting your account is our top priority. Please confirm
                    your account by entering the authentication code sent to
                    <span className="font-medium">
                      {" "}
                      {verificationEmail.substring(0, 3)}***
                      {verificationEmail.substring(
                        verificationEmail.lastIndexOf("@") - 1
                      )}
                    </span>
                    .
                  </p>
                </div>

                <div className="flex gap-2 justify-center mb-6">
                  {verificationCode.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        verificationInputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) =>
                        handleVerificationCodeChange(index, e.target.value)
                      }
                      onKeyDown={(e) => handleVerificationKeyDown(index, e)}
                      onPaste={index === 0 ? handleCodePaste : undefined}
                      className="w-11 h-11 text-black text-center text-xl font-bold border-2 border-gray-300 rounded-md focus:border-[#F58327] focus:outline-none"
                    />
                  ))}
                </div>

                {error && (
                  <div className="mb-4 text-sm text-red-500 text-center">
                    {error}
                  </div>
                )}

                <div className="flex justify-center">
                  <button
                    onClick={handleVerifyCode}
                    disabled={isVerifying}
                    className="px-5 py-2 bg-[#F58327] text-white rounded-md text-base font-medium hover:bg-[#e67016] transition-colors duration-300 disabled:opacity-70"
                  >
                    {isVerifying ? (
                      <div className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </div>
                    ) : (
                      "Submit"
                    )}
                  </button>
                </div>

                <div className="text-center text-sm text-gray-600 mt-4">
                  If you didn't receive a code:
                  <button
                    onClick={handleResendCode}
                    disabled={processing}
                    className="ml-1 text-[#F58327] hover:text-[#e67016] font-medium disabled:opacity-70"
                  >
                    Request a new code
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {!showVerification && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-white">
                {isRegistering
                  ? "Create your account"
                  : "Sign in to your account"}
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
                        billingCycle.charAt(0).toUpperCase() +
                        billingCycle.slice(1)
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
                {/* Google Sign In Button */}
                <div className="mb-5">
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

                {/* Divider */}
                <div className="flex items-center mb-5">
                  <div className="flex-1 h-px bg-gray-800"></div>
                  <span className="px-3 text-sm text-gray-400">
                    or continue with email
                  </span>
                  <div className="flex-1 h-px bg-gray-800"></div>
                </div>

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
                      By {isRegistering ? "registering" : "signing in"}, you
                      agree to Lumix Digital's{" "}
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
                      disabled={processing}
                      className="cursor-pointer relative flex items-center justify-center w-full bg-[#F58327] text-white text-lg rounded-full px-8 py-3 min-h-[54px] disabled:opacity-70 disabled:cursor-not-allowed transition-colors duration-200 hover:bg-[#e67016]"
                    >
                      {processing ? (
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
          </>
        )}
      </motion.div>
    </div>
  );
}
