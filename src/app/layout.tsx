import "./globals.css";
import type { Metadata } from "next";
import { FirebaseProvider } from "@/components/firebase-provider";
import localFont from "next/font/local";
import { Unbounded } from "next/font/google";
import { GoogleTagManager } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { PostHogPageView } from "@/lib/posthog";
import Script from "next/script";

// Load Satoshi as a local font with all weights
const satoshi = localFont({
  src: [
    {
      path: "./fonts/Satoshi-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/Satoshi-LightItalic.otf",
      weight: "300",
      style: "italic",
    },
    {
      path: "./fonts/Satoshi-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Satoshi-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/Satoshi-MediumItalic.otf",
      weight: "500",
      style: "italic",
    },
    {
      path: "./fonts/Satoshi-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/Satoshi-BoldItalic.otf",
      weight: "700",
      style: "italic",
    },
    {
      path: "./fonts/Satoshi-Black.otf",
      weight: "900",
      style: "normal",
    },
    {
      path: "./fonts/Satoshi-BlackItalic.otf",
      weight: "900",
      style: "italic",
    },
    {
      path: "./fonts/Satoshi-Italic.otf",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-satoshi",
});

// Load Unbounded from Google Fonts
const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-unbounded",
});

export const metadata: Metadata = {
  title: "WebDash",
  description: "WebDash | Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script
          id="posthog-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
            !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init bs ws ge fs capture De Ai $s register register_once register_for_session unregister unregister_for_session Is getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty xs Ss createPersonProfile Es gs opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing ys debug ks getPageViewId captureTraceFeedback captureTraceMetric".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
            posthog.init('phc_deiCeICBs4UTwrHBbd0i3BjusZuSLSNKHcSiWIB8sPM', {
              api_host: 'https://us.i.posthog.com',
              person_profiles: 'identified_only',
              capture_pageview: false // We'll handle this manually
            })
          `,
          }}
        />
      </head>
      <body className={`${satoshi.variable} ${unbounded.variable}`}>
        <GoogleTagManager gtmId="AW-17023467754" />
        <FirebaseProvider>
          <PostHogPageView /> {/* Add this component */}
          {children}
        </FirebaseProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
