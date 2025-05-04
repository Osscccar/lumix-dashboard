// src/lib/posthog.tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, ReactNode } from "react";

// Declare the global posthog type for TypeScript
declare global {
  interface Window {
    posthog: any;
  }
}

// PostHog PageView component to track navigation changes
export function PostHogPageView(): React.ReactElement | null {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && typeof window !== "undefined" && window.posthog) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }

      // Send pageview event to PostHog
      window.posthog.capture("$pageview", {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

// Props interface for the PostHog Provider
interface PHProviderProps {
  children: ReactNode;
}

// PostHog Provider component - simplified since you're using the script tag
export function PHProvider({ children }: PHProviderProps): React.ReactElement {
  return <>{children}</>;
}
