// src/app/error.tsx
"use client";

import { useEffect } from "react";
import { AlertTriangle, Home } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to the server
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-[#FEE4E2] p-3">
            <AlertTriangle className="h-12 w-12 text-[#D92D20]" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-4">
          Something went wrong
        </h1>

        <p className="text-gray-400 mb-8">
          We're sorry, but we've encountered an unexpected error. Our team has
          been notified and is working to fix the issue.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-[#F58327] text-white rounded-full font-medium hover:bg-[#E67016] transition-colors"
          >
            Try again
          </button>

          <a
            href="/"
            className="px-4 py-2 bg-transparent border border-gray-600 text-white rounded-full font-medium hover:bg-gray-800 transition-colors flex items-center justify-center"
          >
            <Home className="mr-2 h-4 w-4" />
            Return Home
          </a>
        </div>
      </div>
    </div>
  );
}
