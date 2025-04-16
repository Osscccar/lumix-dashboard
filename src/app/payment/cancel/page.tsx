// src/app/payment/cancel/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";

export default function PaymentCancelPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Start countdown for redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/payment");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-100 p-3">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
        </div>
        
        <h1 className="mb-2 text-center text-2xl font-bold text-neutral-900">Payment Cancelled</h1>
        <p className="mb-6 text-center text-neutral-600">
          Your payment was cancelled. No charge has been made.
        </p>
        
        <div className="text-center">
          <p className="mb-4 text-sm text-neutral-600">
            You can try again whenever you&apos;re ready.
          </p>
          <p className="text-sm text-neutral-500">
            Redirecting to payment page in {countdown} seconds...
          </p>
        </div>
      </div>
    </div>
  );
}