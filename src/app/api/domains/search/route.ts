// src/app/api/domains/search/route.ts
import { NextRequest, NextResponse } from "next/server";

// Environment variables
const DYNADOT_API_KEY = process.env.DYNADOT_API_KEY;
const PRICE_LIMIT_AUD = 15; // Maximum price in AUD

// USD to AUD conversion rate - update this periodically if needed
const USD_TO_AUD_RATE = 1.52;

// List of TLDs to check - focused on most common ones for better reliability
const COMMON_TLDS = [
  "com",
  "net",
  "org",
  "info",
  "co",
  "xyz",
  "site",
  "online",
  "app",
  "store",
  "shop",
  "tech",
  "dev",
];

// For testing when the API isn't working
function getMockDomains(query: string) {
  return [
    { name: `${query}.com`, available: true, price: 9.99, currency: "AUD" },
    { name: `${query}.net`, available: true, price: 8.99, currency: "AUD" },
    { name: `${query}.org`, available: true, price: 12.99, currency: "AUD" },
    { name: `${query}.xyz`, available: true, price: 5.99, currency: "AUD" },
    { name: `${query}.site`, available: true, price: 7.99, currency: "AUD" },
  ];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");

  console.log(`Domain search request received for: "${query}"`);

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  // Clean the query - remove special characters and convert to lowercase
  const cleanQuery = query.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
  console.log(`Cleaned query: "${cleanQuery}"`);

  try {
    // For testing/debugging - use mock data instead of the Dynadot API
    // Comment this out when you want to try the real API
    console.log("Using mock data for testing purposes");
    return NextResponse.json({ domains: getMockDomains(cleanQuery) });

    /* REAL API IMPLEMENTATION - UNCOMMENT WHEN READY TO TEST */
    /*
    if (!DYNADOT_API_KEY) {
      console.error("Missing Dynadot API key in environment variables");
      return NextResponse.json(
        {
          error: "Domain search configuration is incomplete. Please set up API credentials.",
        },
        { status: 500 }
      );
    }
    
    // Generate domain names to check (fewer TLDs for reliability)
    const domainNames = COMMON_TLDS.map(tld => `${cleanQuery}.${tld}`);
    console.log(`Checking ${domainNames.length} domains`);
    
    // Check domains one at a time since batch processing isn't working
    const availableDomains = await checkDomainsOneByOne(domainNames);
    console.log(`Found ${availableDomains.length} available domains`);
    
    // Filter domains that are under the price limit
    const affordableDomains = availableDomains.filter(
      domain => domain.price <= PRICE_LIMIT_AUD
    );
    console.log(`Found ${affordableDomains.length} domains under $${PRICE_LIMIT_AUD} AUD`);

    return NextResponse.json({ domains: affordableDomains });
    */
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

// Check domains one by one instead of in batches
async function checkDomainsOneByOne(
  domainNames: string[]
): Promise<
  Array<{ name: string; available: boolean; price: number; currency: string }>
> {
  const availableDomains = [];

  for (const domain of domainNames) {
    try {
      console.log(`Checking individual domain: ${domain}`);

      // Try the API with just a single domain - format as recommended in Dynadot docs
      // Note: In their docs, domain parameter should be a single value, not a comma-separated list
      const apiUrl = `https://api.dynadot.com/api3.json?key=${DYNADOT_API_KEY}&command=search&domain=${domain}`;

      // Safe logging (avoid TypeScript error with undefined check)
      console.log(
        `API URL: ${apiUrl.replace(
          DYNADOT_API_KEY || "API_KEY",
          "API_KEY_HIDDEN"
        )}`
      );

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.error(
          `Error response: ${response.status} ${response.statusText}`
        );
        const errorText = await response.text();
        console.error(`Error details: ${errorText}`);
        continue;
      }

      const data = await response.json();
      console.log(`Response data: ${JSON.stringify(data, null, 2)}`);

      // Parse the response based on Dynadot's format
      if (data.SearchResponse) {
        if (data.SearchResponse.Status === "error") {
          console.error(`API error: ${data.SearchResponse.Error}`);
          continue;
        }

        // Get domain info
        if (
          data.SearchResponse.DomainSearch &&
          data.SearchResponse.DomainSearch.length > 0
        ) {
          const domainInfo = data.SearchResponse.DomainSearch[0];

          if (
            domainInfo.Available === "1" ||
            domainInfo.Available === "yes" ||
            domainInfo.Available === true
          ) {
            // Get price information
            let price = 9.99; // Default price

            if (domainInfo.Price) {
              price =
                typeof domainInfo.Price === "number"
                  ? domainInfo.Price
                  : parseFloat(domainInfo.Price);
            }

            // Convert to AUD
            const priceInAud = Math.round(price * USD_TO_AUD_RATE * 100) / 100;

            availableDomains.push({
              name: domain,
              available: true,
              price: priceInAud,
              currency: "AUD",
            });

            console.log(`Domain ${domain} is available for $${priceInAud} AUD`);
          }
        }
      }
    } catch (error) {
      console.error(`Error checking domain ${domain}:`, error);
      // Continue with next domain on error
    }

    // Add a small delay between API calls
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return availableDomains;
}
