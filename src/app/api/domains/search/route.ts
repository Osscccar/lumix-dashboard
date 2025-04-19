// src/app/api/domains/search/route.ts
import { NextRequest, NextResponse } from "next/server";

// These would come from your environment variables
const GODADDY_API_KEY = process.env.GODADDY_API_KEY;
const GODADDY_API_SECRET = process.env.GODADDY_API_SECRET;
const PRICE_LIMIT_AUD = 15; // Maximum price in AUD

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  // Check if API credentials are available
  if (!GODADDY_API_KEY || !GODADDY_API_SECRET) {
    console.error("GoDaddy API credentials are missing");
    return NextResponse.json(
      {
        error:
          "Domain search configuration is incomplete. Please contact support.",
      },
      { status: 500 }
    );
  }

  try {
    // Get domain suggestions from GoDaddy API
    const suggestionsResponse = await fetch(
      `https://api.godaddy.com/v1/domains/suggest?query=${encodeURIComponent(
        query
      )}&limit=15`,
      {
        headers: {
          Authorization: `sso-key ${GODADDY_API_KEY}:${GODADDY_API_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!suggestionsResponse.ok) {
      throw new Error(`GoDaddy API error: ${suggestionsResponse.statusText}`);
    }

    const suggestions = await suggestionsResponse.json();

    // Get domain names from suggestions
    const domainNames = suggestions.map((suggestion: any) => suggestion.domain);

    // Check availability and pricing for all suggested domains
    const availabilityResponse = await fetch(
      `https://api.godaddy.com/v1/domains/available?checkType=FULL`,
      {
        method: "POST",
        headers: {
          Authorization: `sso-key ${GODADDY_API_KEY}:${GODADDY_API_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(domainNames),
      }
    );

    if (!availabilityResponse.ok) {
      throw new Error(`GoDaddy API error: ${availabilityResponse.statusText}`);
    }

    const availabilityData = await availabilityResponse.json();

    // Filter domains that are available and under $15 AUD (assuming USD to AUD conversion)
    // Exchange rate of USD to AUD is approximately 1 USD = 1.5 AUD
    const exchangeRate = 1.5;
    const filteredDomains = availabilityData.domains
      .filter(
        (domain: any) =>
          domain.available && domain.price * exchangeRate < PRICE_LIMIT_AUD
      )
      .map((domain: any) => ({
        name: domain.domain,
        available: true,
        price: (domain.price * exchangeRate).toFixed(2),
        currency: "AUD",
      }));

    return NextResponse.json({ domains: filteredDomains });
  } catch (error) {
    console.error("Domain search error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
