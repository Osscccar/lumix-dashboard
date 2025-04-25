import { NextRequest, NextResponse } from "next/server";
import {
  createErrorResponse,
  ErrorType,
  generateRequestId,
} from "@/utils/api-error";

// Environment variables
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
const PRICE_LIMIT_USD = 18; // $18 USD limit

// Define domain types
interface DomainSuggestion {
  domain: string;
  zone: string;
  [key: string]: any;
}

interface DomainStatus {
  domain: string;
  status: string;
  summary?: string;
  [key: string]: any;
}

interface DomainWithPricing {
  name: string;
  available: boolean;
  price: number;
  currency: string;
}

// Primary TLDs to search - focused on affordable, common TLDs
const PRIMARY_TLDS = "com,net,org,co,info,site,online,biz";

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");

  console.log(`Domain search request received for: "${query}"`);

  if (!query) {
    return createErrorResponse(
      "Missing query parameter",
      ErrorType.VALIDATION,
      requestId
    );
  }

  try {
    // Clean the query - remove special characters and convert to lowercase
    const cleanQuery = query.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
    console.log(`Cleaned query: "${cleanQuery}"`);

    // Step 1: Get domain suggestions directly from API
    const domains = await searchDomains(cleanQuery);

    // Step 2: Check availability and pricing in a single batch
    const availableDomains = await checkAvailabilityAndPricing(domains);
    console.log(
      `Found ${availableDomains.length} available domains under $${PRICE_LIMIT_USD}`
    );

    return NextResponse.json({ domains: availableDomains });
  } catch (error) {
    console.error("Domain search error:", error);
    return createErrorResponse(error, ErrorType.SERVER_ERROR, requestId);
  }
}

async function searchDomains(query: string): Promise<DomainSuggestion[]> {
  try {
    // Build the URL with query parameters and our specific TLDs
    const url = `https://domainr.p.rapidapi.com/v2/search?query=${encodeURIComponent(
      query
    )}&defaults=${PRIMARY_TLDS}`;

    console.log(`Making Domainr search request to: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "domainr.p.rapidapi.com",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Domainr API error: ${response.status} - ${errorText.substring(0, 100)}`
      );
    }

    const data = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      throw new Error(`Invalid Domainr response format`);
    }

    console.log(`Found ${data.results.length} domain suggestions`);

    // Validate domains to ensure they follow proper format
    const validDomains = data.results.filter((domain: DomainSuggestion) => {
      // Must have a domain and zone property
      if (!domain.domain || !domain.zone) return false;

      // Check domain format
      const parts = domain.domain.split(".");
      return parts.length >= 2 && parts[0].length > 0;
    });

    return validDomains;
  } catch (error) {
    console.error("Error searching domains:", error);
    throw error;
  }
}

async function checkAvailabilityAndPricing(
  domains: DomainSuggestion[]
): Promise<DomainWithPricing[]> {
  if (!domains.length) return [];

  const availableDomains: DomainWithPricing[] = [];
  const processedDomains = new Set<string>();

  try {
    // Process in smaller batches to avoid rate limits
    const batchSize = 5;

    for (let i = 0; i < Math.min(domains.length, 25); i += batchSize) {
      const batch = domains.slice(i, i + batchSize);

      // Skip empty batches
      if (batch.length === 0) continue;

      // Get domain names for this batch
      const domainNames = batch.map((d) => d.domain);
      const domainsParam = domainNames.join(",");

      console.log(`Checking availability for ${batch.length} domains`);

      const url = `https://domainr.p.rapidapi.com/v2/status?domain=${encodeURIComponent(
        domainsParam
      )}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY,
          "X-RapidAPI-Host": "domainr.p.rapidapi.com",
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (!response.ok) {
        console.error(`Status API error: ${response.status}`);
        continue;
      }

      const data = await response.json();

      if (!data.status || !Array.isArray(data.status)) {
        console.error(`Invalid status response format`);
        continue;
      }

      // Process each domain status
      for (const status of data.status) {
        // Skip domains we've already processed
        if (processedDomains.has(status.domain)) continue;

        // Mark as processed
        processedDomains.add(status.domain);

        // Check if domain is available
        if (isDomainAvailable(status)) {
          const domainInfo = batch.find((d) => d.domain === status.domain);

          if (domainInfo) {
            // Get price based on TLD
            const price = estimateDomainPrice(domainInfo.zone);

            // Only include domains under our price limit
            if (price <= PRICE_LIMIT_USD) {
              availableDomains.push({
                name: domainInfo.domain,
                available: true,
                price: price,
                currency: "USD",
              });
            }
          }
        }
      }

      // Add delay between batches
      if (i + batchSize < Math.min(domains.length, 25)) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    return availableDomains;
  } catch (error) {
    console.error("Error checking availability and pricing:", error);
    return availableDomains; // Return what we have so far
  }
}

// Check if a domain is available based on status codes
function isDomainAvailable(status: DomainStatus): boolean {
  if (!status.domain) return false;

  // These status codes indicate availability
  const availableStatuses = ["inactive", "undelegated", "available"];
  const hasAvailableStatus = availableStatuses.some((s) =>
    status.status?.includes(s)
  );

  // These summary values indicate unavailability
  const unavailableSummaries = ["registered", "unavailable", "reserved"];
  const hasUnavailableSummary = unavailableSummaries.some((s) =>
    status.summary?.includes(s)
  );

  return hasAvailableStatus && !hasUnavailableSummary;
}

// Estimate domain price based on TLD
function estimateDomainPrice(tld: string): number {
  // Current pricing model (USD)
  const tldPricing: { [key: string]: number } = {
    com: 9.99,
    net: 9.99,
    org: 9.99,
    co: 13.99,
    me: 11.99,
    xyz: 9.99,
    info: 6.99,
    site: 7.99,
    online: 6.99,
    biz: 7.99,
    app: 14.99,
    dev: 14.99,
    store: 14.99,
    shop: 14.99,
    io: 17.99,
  };

  // Return the price for the TLD, or a reasonable estimate
  return tldPricing[tld] || 12.99;
}
