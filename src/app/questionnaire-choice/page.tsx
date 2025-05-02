// src/app/questionnaire-choice/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFirebase } from "@/components/firebase-provider";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Calendar,
  FileText,
  Check,
  Mail,
  ArrowRight,
  X,
} from "lucide-react";
import { sendImmediateQuestionnaireMail } from "@/lib/questionnaire-service";
import Image from "next/image";
import mainLogo from "@/app/public/images/image.png";

export default function QuestionnaireChoicePage() {
  const router = useRouter();
  const { user, userData, loading } = useFirebase();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Redirect if user is not authenticated or has already completed the questionnaire
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/");
      } else if (userData?.completedQuestionnaire) {
        router.push("/dashboard");
      }

      if (user?.email) {
        setUserEmail(user.email);
      }
    }
  }, [loading, user, userData, router]);

  // Handle "Do it now" option
  const handleDoItNow = () => {
    router.push("/questionnaire");
  };

  // Handle "Remind me later" option - now sends email immediately
  const handleRemindMeLater = async () => {
    if (!user || !user.email) {
      setError("Unable to send reminder email. Please try again.");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      console.log("Sending reminder email to user:", user.uid);

      const success = await sendImmediateQuestionnaireMail(
        user.uid,
        user.email
      );

      if (success) {
        // Show confirmation instead of redirecting
        setShowConfirmation(true);
      } else {
        throw new Error("Failed to send reminder email");
      }
    } catch (error) {
      console.error("Error sending reminder email:", error);
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
      // Show more detailed errors during development
      if (process.env.NODE_ENV === "development") {
        console.error("Detailed error:", error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle going to dashboard from confirmation
  const handleGoQuestionnaireEmail = () => {
    router.push("/questionnaire");
  };

  // Handle closing confirmation and going back to options
  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d0d0d]">
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
          <p className="text-white text-lg">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d0d0d] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl">
        <div className="flex justify-center mb-8">
          <Image
            src={mainLogo}
            alt="Lumix Logo"
            width={240}
            height={96}
            priority
          />
        </div>

        <AnimatePresence mode="wait">
          {!showConfirmation ? (
            <motion.div
              key="options"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-12">
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Your Website Journey Begins
                </h1>
                <p className="mt-4 text-xl text-gray-400">
                  We need to collect some information about your business and
                  preferences. Would you like to complete the questionnaire now
                  or receive a reminder later?
                </p>
              </div>

              {error && (
                <div className="mb-8 px-6 py-4 border-l-4 border-red-500 bg-[#0d0d0d] text-red-400 rounded">
                  {error}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                {/* Option 1: Do it now */}
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="bg-[#0d0d0d] border border-gray-800 rounded-xl p-8 flex flex-col items-center text-center cursor-pointer"
                  onClick={handleDoItNow}
                >
                  <div className="bg-[#F58327]/20 p-4 rounded-full mb-6">
                    <FileText className="h-10 w-10 text-[#F58327]" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-4">
                    Complete Questionnaire Now
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Take 20-45 minutes to tell us about your business and
                    website needs. This helps us start building right away.
                  </p>
                  <button className="cursor-pointer mt-auto bg-[#F58327] text-white rounded-full px-6 py-3 font-medium hover:bg-[#e67016] transition-colors">
                    Start Questionnaire
                  </button>
                </motion.div>

                {/* Option 2: Email me a link */}
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="bg-[#0d0d0d] border border-gray-800 rounded-xl p-8 flex flex-col items-center text-center cursor-pointer"
                  onClick={handleRemindMeLater}
                >
                  <div className="bg-[#F58327]/20 p-4 rounded-full mb-6">
                    <Calendar className="h-10 w-10 text-[#F58327]" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-4">
                    Send an Email
                  </h3>
                  <p className="text-gray-400 mb-6">
                    We'll send you an email with a link to complete the
                    questionnaire when you're ready.
                  </p>
                  <button
                    className="cursor-pointer mt-auto bg-transparent border border-[#F58327] text-[#F58327] rounded-full px-6 py-3 font-medium hover:bg-[#F58327]/10 transition-colors"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <div className="flex items-center">
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Sending Email...
                      </div>
                    ) : (
                      "Email Me a Link"
                    )}
                  </button>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="confirmation"
              className="bg-[#0d0d0d] border border-gray-800 rounded-xl p-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="relative">
                <button
                  onClick={handleCloseConfirmation}
                  className="cursor-pointer absolute top-0 right-0 text-gray-400 hover:text-white"
                  aria-label="Close confirmation"
                >
                  <X className="h-6 w-6" />
                </button>

                <div className="flex flex-col items-center text-center">
                  <div className="bg-green-900/30 p-5 rounded-full mb-6 border border-green-700">
                    <Check className="h-10 w-10 text-green-400" />
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-4">
                    Email Sent Successfully!
                  </h2>

                  <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-5 mb-6 flex items-center">
                    <Mail className="h-6 w-6 text-[#F58327] mr-3 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-gray-400 text-sm">
                        We've sent an email to:
                      </p>
                      <p className="text-white font-medium break-all">
                        {userEmail}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-400 mb-8">
                    Check your inbox for a link to complete the questionnaire at
                    your convenience. The email should arrive within a few
                    minutes. Be sure to check your spam folder if you don't see
                    it.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <button
                      onClick={handleCloseConfirmation}
                      className="cursor-pointer sm:order-1 bg-transparent border border-gray-600 text-white rounded-full px-6 py-3 font-medium hover:bg-gray-800 transition-colors"
                    >
                      Back to Options
                    </button>

                    <button
                      onClick={handleGoQuestionnaireEmail}
                      className="cursor-pointer sm:order-2 bg-[#F58327] text-white rounded-full px-6 py-3 font-medium hover:bg-[#e67016] transition-colors flex items-center justify-center"
                    >
                      Go to Questionnaire
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
