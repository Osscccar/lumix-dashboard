// src/app/payment/success/layout.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Successful | Lumix",
  description: "Your payment has been processed successfully!",
};

export default function PaymentSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Ads Conversion Tracking Script - Directly in layout */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              <!-- Event snippet for Subscribe conversion page -->
              gtag('event', 'conversion', {'send_to': 'AW-17023467754/hmWlCM7tursaEOqBtrU'});
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
