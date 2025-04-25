// src/app/api/domains/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  createErrorResponse,
  ErrorType,
  generateRequestId,
} from "@/utils/api-error";

// Environment variables
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";
const PRICE_LIMIT_AUD = Number(process.env.DOMAIN_PRICE_LIMIT_AUD || 16);
const USD_TO_AUD_RATE = Number(process.env.USD_TO_AUD_RATE || 1.52);

// Define domain types to improve type safety
interface DomainSuggestion {
  domain: string;
  zone: string;
  [key: string]: any; // For any other properties
}

interface DomainStatus {
  domain: string;
  status: string;
  [key: string]: any;
}

interface DomainWithPricing {
  name: string;
  available: boolean;
  price: number;
  currency: string;
}

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

    // Step 1: Get domain suggestions
    const domains = await searchDomains(cleanQuery);
    console.log(`Found ${domains.length} domain suggestions`);

    // Step 2: Check availability
    const availableDomains = await checkAvailability(domains);
    console.log(`Found ${availableDomains.length} available domains`);

    // Step 3: Format domains with pricing estimates
    const formattedDomains = formatDomainsWithPricing(availableDomains);
    console.log(`Returning ${formattedDomains.length} domains with pricing`);

    return NextResponse.json({ domains: formattedDomains });
  } catch (error) {
    console.error("Domain search error:", error);
    return createErrorResponse(error, ErrorType.SERVER_ERROR, requestId);
  }
}

async function searchDomains(query: string): Promise<DomainSuggestion[]> {
  try {
    // Set default TLDs that are likely to be under our price limit
    const defaultTlds = "com,net,org,co,xyz,info,site,online,biz";

    // Build the URL with query parameters
    const url = `https://domainr.p.rapidapi.com/v2/search?query=${encodeURIComponent(
      query
    )}&defaults=${defaultTlds}`;

    console.log(`Making Domainr search request to: ${url}`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "domainr.p.rapidapi.com",
      },
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

    // Return the domain results
    return data.results as DomainSuggestion[];
  } catch (error) {
    console.error("Error searching domains:", error);
    throw error;
  }
}

async function checkAvailability(
  domains: DomainSuggestion[]
): Promise<DomainSuggestion[]> {
  if (!domains.length) return [];

  try {
    // Extract domain names from the results
    const domainNames = domains.map((result) => result.domain);

    // Process in smaller batches to avoid rate limits
    const batchSize = 5;
    const availableDomains: DomainSuggestion[] = []; // Fixed: Added type here

    for (let i = 0; i < domainNames.length; i += batchSize) {
      const batch = domainNames.slice(i, i + batchSize);
      const domainsParam = batch.join(",");

      const url = `https://domainr.p.rapidapi.com/v2/status?domain=${encodeURIComponent(
        domainsParam
      )}`;

      console.log(`Checking availability for batch of ${batch.length} domains`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY,
          "X-RapidAPI-Host": "domainr.p.rapidapi.com",
        },
      });

      if (!response.ok) {
        console.error(`Status API error: ${response.status}`);
        // Continue to the next batch instead of failing
        continue;
      }

      const data = await response.json();

      if (!data.status || !Array.isArray(data.status)) {
        console.error(`Invalid status response format`);
        continue;
      }

      // Find domains that are available
      data.status.forEach((item: DomainStatus) => {
        // Status codes: 'inactive' or 'undelegated' typically mean the domain is available
        if (
          item.domain &&
          (item.status.includes("inactive") ||
            item.status.includes("undelegated"))
        ) {
          // Find the original domain info
          const domainInfo = domains.find((d) => d.domain === item.domain);
          if (domainInfo) {
            availableDomains.push(domainInfo);
          }
        }
      });

      // Add delay between batches
      if (i + batchSize < domainNames.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    return availableDomains;
  } catch (error) {
    console.error("Error checking availability:", error);
    throw error;
  }
}

// Format domains with estimated pricing
function formatDomainsWithPricing(
  domains: DomainSuggestion[]
): DomainWithPricing[] {
  // TLD pricing estimates in USD (these are approximations)
  const tldPricing: { [key: string]: number } = {
    com: 9.99,
    net: 8.99,
    org: 9.99,
    co: 9.99,
    me: 9.99,
    io: 29.99, // Typically expensive
    xyz: 5.99,
    info: 6.99,
    site: 7.99,
    online: 6.99,
    biz: 7.99,
    app: 12.99,
    dev: 12.99,
    store: 9.99,
    shop: 9.99,
  };

  return domains
    .map((domain) => {
      const tld = domain.zone;
      // Estimate price based on TLD, default to 9.99 if unknown
      const basePrice = tldPricing[tld] || 9.99;
      // Convert to AUD
      const priceInAud = Math.round(basePrice * USD_TO_AUD_RATE * 100) / 100;

      // Only include domains under the price limit
      if (priceInAud <= PRICE_LIMIT_AUD) {
        return {
          name: domain.domain,
          available: true,
          price: priceInAud,
          currency: "AUD",
        };
      }
      return null;
    })
    .filter((domain): domain is DomainWithPricing => domain !== null);
}
