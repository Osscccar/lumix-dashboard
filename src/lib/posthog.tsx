"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, ReactNode } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

// PostHog PageView component to track navigation changes
export function PostHogPageView(): JSX.Element | null {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }

      // Send pageview event to PostHog
      posthog.capture("$pageview", {
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

// PostHog Provider component
export function PHProvider({ children }: PHProviderProps): JSX.Element {
  useEffect(() => {
    // Initialize PostHog only on the client side
    if (typeof window !== "undefined") {
      posthog.init("phc_deiCeICBs4UTwrHBbd0i3BjusZuSLSNKHcSiWIB8sPM", {
        api_host: "https://us.i.posthog.com",
        capture_pageview: false, // We'll handle this manually
        person_profiles: "identified_only",
      });
    }
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
