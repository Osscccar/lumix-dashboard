import "./globals.css";
import type { Metadata } from "next";
import { FirebaseProvider } from "@/components/firebase-provider";
import localFont from "next/font/local";
import { Unbounded } from "next/font/google";
import Script from "next/script";
import { GoogleTagManager } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/react";

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
  title: "Lumix Digital",
  description: "Client dashboard for Lumix Digital",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${satoshi.variable} ${unbounded.variable}`}>
        <GoogleTagManager gtmId="AW-17023467754" />
        <FirebaseProvider>{children}</FirebaseProvider>
        <Analytics />
      </body>
    </html>
  );
}
