// src/lib/tenweb-service.ts
// Configuration
const API_KEY = process.env.TENWEB_API_KEY || "";
const BASE_URL = "https://api.10web.io";

interface TenWebWebsiteParams {
  domain_id: number;
  business_type: string;
  business_name: string;
  business_description: string;
}

/**
 * Creates a new website on 10web platform
 * @param businessName The business name from questionnaire
 * @returns Domain ID of the created website
 */
export async function createTenWebSite(
  businessName: string
): Promise<number | null> {
  try {
    // Sanitize the business name for use as a subdomain
    // Replace spaces, special chars with hyphens, lowercase everything
    const cleanBusinessName = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-") // Remove consecutive hyphens
      .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens

    // Ensure subdomain meets length requirements (3-63 chars)
    let subdomain = cleanBusinessName;
    if (subdomain.length < 3) {
      subdomain = `site-${subdomain}`;
    }
    if (subdomain.length > 63) {
      subdomain = subdomain.substring(0, 63);
    }

    // Generate random password
    const adminPassword = generatePassword();

    console.log(`Creating 10web website with subdomain: ${subdomain}`);

    // Create website request
    const response = await fetch(`${BASE_URL}/hosting/website`, {
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subdomain: subdomain,
        region: "us-central1-c",
        site_title: businessName,
        admin_username: "admin",
        admin_password: adminPassword,
      }),
    });

    // Get response data regardless of status code
    const responseData = await response.json();

    // Check for successful response (both 200 and 201 are valid success codes)
    if (
      (response.ok || response.status === 201) &&
      responseData.status === "ok"
    ) {
      console.log("Website created successfully:", responseData);
      return responseData.data.domain_id;
    } else {
      console.error("Error response from 10web API:", responseData);
      throw new Error(
        `Failed to create website: ${JSON.stringify(responseData)}`
      );
    }
  } catch (error) {
    console.error("Error creating 10web site:", error);
    return null;
  }
}

/**
 * Generates an AI-powered website on 10web
 * @param params Website generation parameters
 * @returns Success status
 */
export async function generateAIWebsite(
  params: TenWebWebsiteParams
): Promise<boolean> {
  try {
    console.log("Generating AI website with params:", params);

    const response = await fetch(`${BASE_URL}/ai/generate_site`, {
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    // Get response data
    const responseText = await response.text();

    // Log the raw response for debugging
    console.log("Raw AI generation response:", responseText);

    let responseData;
    try {
      // Try to parse as JSON
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse response as JSON:", e);
      return false;
    }

    if (response.ok) {
      console.log("AI website generated successfully:", responseData);
      // Different success indicators used by 10web API
      return (
        responseData.status === 200 ||
        responseData.status === "ok" ||
        responseData.msg === "Success"
      );
    } else {
      console.error("Error response from 10web AI API:", responseData);
      return false;
    }
  } catch (error) {
    console.error("Error generating AI website:", error);
    return false;
  }
}

/**
 * Processes questionnaire answers to generate a 10web AI-powered website
 * @param answers The questionnaire answers from the user
 * @returns Success status and website URL if successful
 */
export async function processQuestionnaireFor10Web(
  answers: any
): Promise<{ success: boolean; url?: string }> {
  try {
    // Extract required data from questionnaire answers
    const businessName = answers.businessName as string;
    const businessCategory = answers.businessCategory as string;
    const businessDescription = answers.businessDescription as string;

    console.log("Processing questionnaire data for 10web:", {
      businessName,
      businessCategory,
      businessDescription: businessDescription?.substring(0, 50) + "...", // Log truncated for brevity
    });

    if (!businessName || !businessCategory || !businessDescription) {
      console.error("Missing required fields:", {
        hasName: !!businessName,
        hasCategory: !!businessCategory,
        hasDescription: !!businessDescription,
      });
      throw new Error("Missing required fields for website generation");
    }

    // Step 1: Create the website
    const domainId = await createTenWebSite(businessName);

    if (!domainId) {
      throw new Error("Failed to create 10web site");
    }

    console.log(`Website created successfully with domain ID: ${domainId}`);

    // Wait for the domain to be fully provisioned (important!)
    console.log("Waiting for domain provisioning...");
    await new Promise((resolve) => setTimeout(resolve, 240000)); // 240 seconds wait (4 minutes)
    console.log("Domain provisioning wait completed");

    // Step 2: Generate AI website
    const params: TenWebWebsiteParams = {
      domain_id: domainId,
      business_type: businessCategory,
      business_name: businessName,
      business_description: businessDescription,
    };

    console.log("Starting AI website generation");
    const success = await generateAIWebsite(params);

    if (!success) {
      throw new Error("Failed to generate AI website");
    }

    console.log("AI website generated successfully");

    // Form the website URL based on the subdomain
    const sanitizedBusinessName = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const websiteUrl = `https://${sanitizedBusinessName}.10web.me`;
    console.log(`Website URL: ${websiteUrl}`);

    return {
      success: true,
      url: websiteUrl,
    };
  } catch (error) {
    console.error("Error processing questionnaire for 10web:", error);
    return { success: false };
  }
}

/**
 * Generate a secure random password for admin account
 */
function generatePassword(): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  // Ensure at least one of each character type
  let password =
    lowercase.charAt(Math.floor(Math.random() * lowercase.length)) +
    uppercase.charAt(Math.floor(Math.random() * uppercase.length)) +
    numbers.charAt(Math.floor(Math.random() * numbers.length)) +
    special.charAt(Math.floor(Math.random() * special.length));

  // Add 8 more random characters
  const allChars = lowercase + uppercase + numbers + special;
  for (let i = 0; i < 8; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Shuffle the password characters
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}
