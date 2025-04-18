// src/app/questionnaire-choice/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFirebase } from "@/components/firebase-provider";
import { motion } from "framer-motion";
import { Loader2, Calendar, FileText } from "lucide-react";
import { sendImmediateQuestionnaireMail } from "@/lib/questionnaire-service";
import Image from "next/image";
import mainLogo from "@/app/public/images/mainLogo.png";

export default function QuestionnaireChoicePage() {
  const router = useRouter();
  const { user, userData, loading } = useFirebase();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  // Redirect if user is not authenticated or has already completed the questionnaire
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/");
      } else if (userData?.completedQuestionnaire) {
        router.push("/dashboard");
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
        // Redirect to dashboard with a success message
        router.push("/questionnaire");
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

  if (loading) {
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
          <p className="text-white text-lg">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl">
        <div className="flex justify-center mb-8">
          <Image
            src={mainLogo}
            alt="Lumix Logo"
            width={120}
            height={48}
            priority
          />
        </div>

        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Your Website Journey Begins
          </h1>
          <p className="mt-4 text-xl text-gray-400">
            We need to collect some information about your business and
            preferences. Would you like to complete the questionnaire now or
            receive a reminder later?
          </p>
        </div>

        {error && (
          <div className="mb-8 px-6 py-4 border-l-4 border-red-500 bg-black text-red-400 rounded">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Option 1: Do it now */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="bg-black border border-gray-800 rounded-xl p-8 flex flex-col items-center text-center cursor-pointer"
            onClick={handleDoItNow}
          >
            <div className="bg-[#F58327]/20 p-4 rounded-full mb-6">
              <FileText className="h-10 w-10 text-[#F58327]" />
            </div>
            <h3 className="text-xl font-medium text-white mb-4">
              Complete Questionnaire Now
            </h3>
            <p className="text-gray-400 mb-6">
              Take 10-15 minutes to tell us about your business and website
              needs. This helps us start building right away.
            </p>
            <button className="cursor-pointer mt-auto bg-[#F58327] text-white rounded-full px-6 py-3 font-medium hover:bg-[#e67016] transition-colors">
              Start Questionnaire
            </button>
          </motion.div>

          {/* Option 2: Remind me later - now sends immediate email */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="bg-black border border-gray-800 rounded-xl p-8 flex flex-col items-center text-center cursor-pointer"
            onClick={handleRemindMeLater}
          >
            <div className="bg-[#F58327]/20 p-4 rounded-full mb-6">
              <Calendar className="h-10 w-10 text-[#F58327]" />
            </div>
            <h3 className="text-xl font-medium text-white mb-4">
              Remind Me Later
            </h3>
            <p className="text-gray-400 mb-6">
              We'll send you an email with a link to complete the questionnaire
              when you're ready.
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
      </div>
    </div>
  );
}
