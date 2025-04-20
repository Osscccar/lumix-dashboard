// src/app/api/domains/search/route.ts
import { NextRequest, NextResponse } from "next/server";

// Environment variables
const DYNADOT_API_KEY = process.env.DYNADOT_API_KEY;
const PRICE_LIMIT_AUD = 15; // Maximum price in AUD

// USD to AUD conversion rate - update this periodically if needed
const USD_TO_AUD_RATE = 1.52;

// Extended list of TLDs to check with Dynadot
const COMMON_TLDS = [
  // General TLDs
  "com",
  "net",
  "org",
  "info",
  "biz",
  "name",

  // Country-specific TLDs
  "co",
  "us",
  "ca",
  "uk",
  "eu",
  "de",
  "nl",
  "au",
  "nz",

  // Common affordable new TLDs
  "xyz",
  "site",
  "online",
  "app",
  "dev",
  "shop",
  "store",
  "tech",
  "digital",
  "live",
  "blog",
  "art",
  "design",
  "life",
  "world",
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  if (!DYNADOT_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Domain search configuration is incomplete. Please set up API credentials.",
      },
      { status: 500 }
    );
  }

  try {
    // Clean the query - remove special characters and convert to lowercase
    const cleanQuery = query.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();

    // Generate domain names to check
    // For very long queries, reduce the number of TLDs to check
    const tldList =
      cleanQuery.length > 15 ? COMMON_TLDS.slice(0, 10) : COMMON_TLDS;
    const domainNames = tldList.map((tld) => `${cleanQuery}.${tld}`);

    // Check domain availability using Dynadot API
    const availableDomains = await checkDomainsSingularly(domainNames);

    // Filter domains that are under the price limit
    const affordableDomains = availableDomains.filter(
      (domain) => domain.price <= PRICE_LIMIT_AUD
    );

    return NextResponse.json({ domains: affordableDomains });
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

interface DomainResult {
  name: string;
  available: boolean;
  price: number;
  currency: string;
}

// Check domains one by one for better reliability
async function checkDomainsSingularly(
  domainNames: string[]
): Promise<DomainResult[]> {
  const availableDomains: DomainResult[] = [];

  for (const domain of domainNames) {
    try {
      // Build the API URL for a single domain check
      const apiUrl = `https://api.dynadot.com/api3.json?key=${
        DYNADOT_API_KEY || ""
      }&command=search&domain=${encodeURIComponent(domain)}`;

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();

      // Check if domain is available based on API response format
      let isAvailable = false;
      let price = 9.99; // Default price if not specified

      if (
        data.SearchResponse?.DomainSearch &&
        data.SearchResponse.DomainSearch.length > 0
      ) {
        const domainInfo = data.SearchResponse.DomainSearch[0];
        isAvailable = domainInfo.Available === "1";

        if (domainInfo.Price) {
          price = parseFloat(domainInfo.Price);
        }
      } else if (data.search_results) {
        // Alternative response format
        const result = data.search_results.find((r: any) => r.name === domain);
        if (result) {
          isAvailable = result.available === "yes";
          price = parseFloat(result.price);
        }
      }

      if (isAvailable) {
        // Convert price from USD to AUD
        const priceInAud = Math.round(price * USD_TO_AUD_RATE * 100) / 100;

        availableDomains.push({
          name: domain,
          available: true,
          price: priceInAud,
          currency: "AUD",
        });
      }
    } catch (error) {
      // Continue with next domain on error
      continue;
    }

    // Add a small delay between API calls
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return availableDomains;
}
