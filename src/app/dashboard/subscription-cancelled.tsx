"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, RefreshCcw, LogOut, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useFirebase } from "@/components/firebase-provider";

export default function SubscriptionCancelledScreen() {
  const router = useRouter();
  const { user, logout } = useFirebase();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState("");

  // Handle renewal - send to Stripe portal
  const handleRenewSubscription = () => {
    if (!user) return;

    setIsLoading(true);
    setLoadingAction("renewing");

    // Redirect to the portal to manage subscription
    window.location.href = `/api/create-portal-session?userId=${user.uid}&action=renew`;
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      setLoadingAction("logging_out");
      await logout();
      window.location.href = "/?from=logout";
    } catch (error) {
      console.error("Error logging out:", error);
      setIsLoading(false);
      setLoadingAction("");
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!user) return;

    // Show confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to delete all your data? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setIsLoading(true);
      setLoadingAction("deleting");

      // Delete user data from Firestore
      await deleteDoc(doc(db, "users", user.uid));

      // Log the user out
      await logout();

      // Redirect to home with message
      window.location.href = "/?from=account_deleted";
    } catch (error) {
      console.error("Error deleting account:", error);
      setIsLoading(false);
      setLoadingAction("");
      alert(
        "There was an error deleting your account. Please try again or contact support."
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d] text-white p-6">
      <motion.div
        className="max-w-2xl w-full bg-[#0A0A0A] border border-[#222222] rounded-xl p-8 md:p-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#111111] rounded-full flex items-center justify-center mx-auto mb-6">
            <RefreshCcw className="h-8 w-8 text-[#F58327]" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-4">
            Subscription Cancelled
          </h1>
          <p className="text-neutral-400 text-lg mb-6">
            Your website is currently offline because your subscription has been
            cancelled. To restore your website and access your dashboard, please
            renew your subscription.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleRenewSubscription}
            disabled={isLoading}
            className="cursor-pointer w-full bg-[#F58327] text-white font-medium py-3 px-6 rounded-full flex items-center justify-center hover:bg-[#e67016] transition-colors duration-200"
          >
            {isLoading && loadingAction === "renewing" ? (
              <>
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
                Redirecting...
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-5 w-5" />
                Reactivate Subscription
              </>
            )}
          </button>

          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="cursor-pointer w-full bg-[#111111] text-white font-medium py-3 px-6 rounded-full flex items-center justify-center hover:bg-[#222222] transition-colors duration-200"
          >
            {isLoading && loadingAction === "logging_out" ? (
              <>
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-5 w-5" />
                Log Out
              </>
            )}
          </button>

          <button
            onClick={handleDeleteAccount}
            disabled={isLoading}
            className="cursor-pointer w-full bg-transparent border border-red-700 text-red-500 font-medium py-3 px-6 rounded-full flex items-center justify-center hover:bg-red-900/20 transition-colors duration-200"
          >
            {isLoading && loadingAction === "deleting" ? (
              <>
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
                Deleting account...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-5 w-5" />
                Delete All My Data
              </>
            )}
          </button>
        </div>

        <p className="text-neutral-500 text-sm mt-8 text-center">
          Need help? Contact our support team at{" "}
          <a
            href="mailto:support@lumixdigital.com.au"
            className="text-[#F58327] hover:underline"
          >
            support@lumixdigital.com.au
          </a>
        </p>
      </motion.div>
    </div>
  );
}
