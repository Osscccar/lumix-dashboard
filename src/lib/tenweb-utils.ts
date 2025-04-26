// src/lib/tenweb-utils.ts
import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

/**
 * Get all domains for the account from 10web
 * This is used to find the domain ID for a specific domain
 */
export async function getTenWebDomains() {
  try {
    const API_KEY = process.env.TENWEB_API_KEY || "";
    const BASE_URL = "https://api.10web.io";

    const response = await fetch(`${BASE_URL}/account/domains`, {
      method: "GET",
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching domains: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching 10web domains:", error);
    return [];
  }
}

/**
 * Get domain ID by site URL
 * @param siteUrl The website URL to look up
 * @returns Domain ID if found, null otherwise
 */
export async function getDomainIdBySiteUrl(
  siteUrl: string
): Promise<number | null> {
  try {
    const domains = await getTenWebDomains();

    // Find the domain that matches the site URL
    const domain = domains.find(
      (domain: any) =>
        domain.site_url === siteUrl ||
        domain.site_url === siteUrl.replace(/\/$/, "") ||
        domain.site_url === `https://${siteUrl}` ||
        domain.site_url === `https://${siteUrl}/`
    );

    return domain ? domain.id : null;
  } catch (error) {
    console.error("Error getting domain ID:", error);
    return null;
  }
}

/**
 * Store 10web generation data in Firestore
 * This helps with tracking generation status and debugging
 */
export async function logWebsiteGeneration(userId: string, data: any) {
  try {
    // Create a new document in a 'websiteGenerations' collection
    const generationId = `gen_${Date.now()}`;
    await setDoc(doc(db, "websiteGenerations", generationId), {
      userId,
      ...data,
      createdAt: new Date().toISOString(),
      status: "pending",
    });

    return generationId;
  } catch (error) {
    console.error("Error logging website generation:", error);
    return null;
  }
}

/**
 * Update website generation status
 */
export async function updateGenerationStatus(
  generationId: string,
  status: string,
  result?: any
) {
  try {
    const docRef = doc(db, "websiteGenerations", generationId);

    await updateDoc(docRef, {
      status,
      completedAt: new Date().toISOString(),
      result: result || null,
    });

    return true;
  } catch (error) {
    console.error("Error updating generation status:", error);
    return false;
  }
}

/**
 * Checks if a website already exists for a user
 * Helps prevent duplicate website generations
 */
export async function hasExistingWebsite(userId: string): Promise<boolean> {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      return !!(userData.websiteUrl && userData.websiteGeneratedAt);
    }

    return false;
  } catch (error) {
    console.error("Error checking for existing website:", error);
    return false;
  }
}
