// app/providers.tsx
"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_POSTHOG_KEY &&
      process.env.NEXT_PUBLIC_POSTHOG_HOST
    ) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        capture_pageview: false, // Disable automatic pageview capture, as we capture manually
        session_recording: {
          enabled: true,
          maskAllInputs: false, // Set to true if you want to mask all input values
          maskInputOptions: {
            password: true,
            email: true,
            // Add other fields you want to mask
          },
        },
      });
      // Check if session recording is enabled
      console.log(
        "Session recording enabled:",
        posthog.sessionRecording?.__enabled
      );
    } else {
      console.warn("PostHog environment variables are not set");
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
