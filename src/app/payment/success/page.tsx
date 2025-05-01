"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, ArrowRight } from "lucide-react";
import { updateUserPaymentStatus } from "@/lib/auth-service";
import { useFirebase } from "@/components/firebase-provider";
import { motion } from "framer-motion";
import { GoogleAnalytics } from "@next/third-parties/google";
import Script from "next/script";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
  }
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, userData, loading } = useFirebase();
  const [countdown, setCountdown] = useState(5);
  const [updating, setUpdating] = useState(true);

  // Get parameters from URL
  const sessionId = searchParams.get("session_id");
  const paymentId = searchParams.get("payment_intent") || "direct-payment";

  // Facebook Pixel ID - replace with your actual Pixel ID
  const FB_PIXEL_ID = "694653996337517";

  // Track conversion event
  useEffect(() => {
    // Google Analytics tracking
    if (typeof window !== "undefined" && window.gtag) {
      // Directly call gtag
      window.gtag("event", "conversion", {
        send_to: "AW-17023467754/hmWlCM7tursaEOqBtrU",
      });

      console.log("Conversion tracking attempted");
    } else {
      console.log("GTM not available yet");

      // Try again after a slight delay
      const timer = setTimeout(() => {
        if (window.gtag) {
          window.gtag("event", "conversion", {
            send_to: "AW-17023467754/hmWlCM7tursaEOqBtrU",
          });
          console.log("Delayed conversion tracking attempted");
        } else {
          console.log("GTM still not available after delay");
        }
      }, 2000);

      return () => clearTimeout(timer);
    }

    // Facebook Pixel tracking
    if (typeof window !== "undefined" && window.fbq) {
      // Standard conversion event
      window.fbq("track", "Purchase", {
        value: 150,
        currency: "AUD",
        content_ids: [userData?.planType || "unknown"],
        content_type: "product",
      });
      console.log("Facebook Pixel conversion tracking attempted");
    } else {
      console.log("Facebook Pixel not available yet");

      // Try again after a slight delay
      const timerFb = setTimeout(() => {
        if (window.fbq) {
          window.fbq("track", "Purchase", {
            value: 150,
            currency: "AUD",
            content_ids: [userData?.planType || "unknown"],
            content_type: "product",
          });
          console.log("Delayed Facebook Pixel tracking attempted");
        } else {
          console.log("Facebook Pixel still not available after delay");
        }
      }, 2000);

      return () => clearTimeout(timerFb);
    }
  }, [userData]);

  useEffect(() => {
    async function updatePaymentStatus() {
      if (user) {
        try {
          console.log("Updating payment status for user:", user.uid);
          const paymentIdentifier = sessionId || paymentId;
          await updateUserPaymentStatus(user.uid, paymentIdentifier);
          console.log("Payment status updated successfully");

          setUpdating(false);

          // Start countdown for redirect
          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                setTimeout(() => {
                  router.push("/questionnaire-choice");
                }, 0);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);

          return () => clearInterval(timer);
        } catch (error) {
          console.error("Error updating payment status:", error);
          setUpdating(false);
        }
      } else if (!loading && !user) {
        console.log("No user found, redirecting to sign-in");
        router.push("/");
      }
    }

    if (!loading) {
      updatePaymentStatus();
    }
  }, [user, sessionId, paymentId, router, loading]);

  if (loading || updating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative mb-6 flex justify-center">
            <motion.div
              className="h-12 w-12 rounded-full border-4 border-neutral-800 border-t-[#F58327]"
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            />
          </div>
          <p className="text-white text-lg">Processing your payment...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-black to-neutral-900 p-6">
      {/* Facebook Pixel Base Code */}
      <Script id="facebook-pixel-script" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${FB_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>

      {/* Add Google Analytics specifically for this page */}
      <GoogleAnalytics gaId="AW-17023467754" />

      <motion.div
        className="w-full max-w-md rounded-2xl bg-neutral-900 shadow-xl p-8 border border-neutral-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="mb-8 flex justify-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.div
            className="rounded-full bg-[#F58327] p-5"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{
              repeat: Infinity,
              repeatType: "reverse",
              duration: 1.5,
            }}
          >
            <CheckCircle className="h-16 w-16 text-black" />
          </motion.div>
        </motion.div>

        <h1 className="mb-3 text-center text-3xl font-bold text-white">
          Payment Successful!
        </h1>

        <div className="text-center">
          <p className="mb-8 text-neutral-300">
            Thank you for your payment. We're excited to start building your
            website!
          </p>

          <div className="flex items-center justify-center mb-6">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className={`h-2 w-2 mx-1 rounded-full ${
                  i < countdown ? "bg-[#F58327]" : "bg-neutral-700"
                }`}
                initial={{ opacity: 0.7 }}
                animate={{ opacity: i < countdown ? 1 : 0.5 }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>

          <motion.button
            className="cursor-pointer w-full py-3 px-6 bg-[#F58327] text-black font-bold rounded-lg flex items-center justify-center transition-all hover:bg-[#E47317]"
            onClick={() => router.push("/questionnaire-choice")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            Continue
            <ArrowRight className="ml-2 h-5 w-5" />
          </motion.button>

          <p className="mt-4 text-neutral-500 text-sm">
            Auto-redirecting in{" "}
            <span className="font-medium text-[#F58327]">{countdown}</span>{" "}
            seconds...
          </p>
        </div>
      </motion.div>
    </div>
  );
}
