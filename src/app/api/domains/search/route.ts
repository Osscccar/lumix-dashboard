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

  // More specific/niche TLDs
  "agency",
  "business",
  "club",
  "email",
  "games",
  "group",
  "host",
  "link",
  "media",
  "news",
  "one",
  "page",
  "team",
  "today",
  "work",
  "zone",
  "space",
  "website",
  "guru",
  "cool",
];

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

  if (!DYNADOT_API_KEY) {
    console.error("Missing Dynadot API key in environment variables");
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
    console.log(`Cleaned query: "${cleanQuery}"`);

    // For testing/debugging when API integration isn't working
    // Uncomment this section to use mock data instead of the real API
    /*
    console.log("Using mock data for testing");
    const mockDomains = [
      { name: `${cleanQuery}.com`, available: true, price: 9.99, currency: "AUD" },
      { name: `${cleanQuery}.net`, available: true, price: 8.99, currency: "AUD" },
      { name: `${cleanQuery}.org`, available: true, price: 12.99, currency: "AUD" }
    ];
    return NextResponse.json({ domains: mockDomains });
    */

    // Generate domain names to check
    // For very long queries, reduce the number of TLDs to check
    const tldList =
      cleanQuery.length > 15 ? COMMON_TLDS.slice(0, 10) : COMMON_TLDS;
    console.log(`Using ${tldList.length} TLDs for this search`);

    const domainNames = tldList.map((tld) => `${cleanQuery}.${tld}`);

    // Check domain availability using Dynadot API
    const availableDomains = await checkDomainsWithDynadot(domainNames);
    console.log(`Found ${availableDomains.length} available domains in total`);

    // Filter domains that are under the price limit
    const affordableDomains = availableDomains.filter(
      (domain) => domain.price <= PRICE_LIMIT_AUD
    );
    console.log(
      `Found ${affordableDomains.length} domains under ${PRICE_LIMIT_AUD} AUD`
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

async function checkDomainsWithDynadot(
  domainNames: string[]
): Promise<
  Array<{ name: string; available: boolean; price: number; currency: string }>
> {
  const availableDomains = [];

  // Process in smaller batches to avoid rate limiting
  const batchSize = 10;

  for (let i = 0; i < domainNames.length; i += batchSize) {
    const batch = domainNames.slice(i, i + batchSize);

    try {
      // Build the Dynadot API URL - using JSON format for easier parsing
      // Ensure domain parameter is properly formatted and encoded
      const domainsParam = encodeURIComponent(batch.join(","));

      // Debug logs
      console.log(`Checking domains batch: ${batch.join(", ")}`);

      const apiUrl = `https://api.dynadot.com/api3.json?key=${DYNADOT_API_KEY}&command=search&domain=${domainsParam}`;

      console.log(
        `Making API request to: ${apiUrl.replace(
          DYNADOT_API_KEY,
          "API_KEY_HIDDEN"
        )}`
      );

      // Set timeout for the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(apiUrl, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Dynadot API returned ${response.status}`);
      }

      // Parse JSON response
      const data = await response.json();

      // Log the raw response for debugging
      console.log("Raw Dynadot API response:", JSON.stringify(data, null, 2));

      // Check for error response format (varies based on API implementation)
      if (data.SearchResponse && data.SearchResponse.Status === "error") {
        console.error("Dynadot API error:", data.SearchResponse.Error);
        throw new Error(`Dynadot API error: ${data.SearchResponse.Error}`);
      }

      // Handle various possible response formats
      if (
        (data.status !== "success" &&
          !data.SearchResponse?.Status?.includes("ok")) ||
        (!data.search_results && !data.SearchResponse?.DomainSearch)
      ) {
        console.error("Invalid response from Dynadot API:", data);
        continue;
      }

      // Determine which response format we got and extract results accordingly
      let searchResults = [];

      if (data.search_results) {
        // Standard format
        searchResults = data.search_results;
      } else if (data.SearchResponse?.DomainSearch) {
        // Alternative format
        searchResults = data.SearchResponse.DomainSearch.map((item) => ({
          name: item.Domain,
          available: item.Available === "1" ? "yes" : "no",
          price: item.Price || "9.99",
        }));
      }

      // Process search results
      searchResults.forEach((result) => {
        const isAvailable =
          result.available === "yes" ||
          result.available === "1" ||
          result.available === true;
        if (isAvailable) {
          // Get price - handle different formats
          let price =
            typeof result.price === "number"
              ? result.price
              : parseFloat(result.price || "9.99");

          // Convert price from USD to AUD
          const priceInAud = Math.round(price * USD_TO_AUD_RATE * 100) / 100;

          availableDomains.push({
            name: result.name || result.Domain,
            available: true,
            price: priceInAud,
            currency: "AUD",
          });
        }
      });
    } catch (error) {
      console.error(`Error checking batch of domains:`, error);
      // Continue with next batch on error
    }

    // Add a small delay between batches
    if (i + batchSize < domainNames.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return availableDomains;
}
