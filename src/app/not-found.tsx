// src/app/not-found.tsx
"use client";

import { Home } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <h1 className="text-8xl font-bold text-[#F58327]">404</h1>
        </div>

        <h2 className="text-2xl font-bold text-white mb-4">Page Not Found</h2>

        <p className="text-gray-400 mb-8">
          We're sorry, but the page you're looking for doesn't exist or has been
          moved.
        </p>

        <div className="flex justify-center">
          <a
            href="/"
            className="px-4 py-2 bg-[#F58327] text-white rounded-full font-medium hover:bg-[#E67016] transition-colors flex items-center justify-center"
          >
            <Home className="mr-2 h-4 w-4" />
            Return Home
          </a>
        </div>
      </div>
    </div>
  );
}
