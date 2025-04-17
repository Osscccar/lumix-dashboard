// src/lib/verification-service.ts
import { ref, set, get, remove } from "firebase/database";
import { realtimeDb } from "./firebase";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import crypto from "crypto";

// Generate a 6-digit verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create a secure key from an email
function createSecureKey(email: string): string {
  return crypto
    .createHash("sha256")
    .update(email.toLowerCase().trim())
    .digest("hex");
}

// Store verification code in Firebase Realtime Database
export async function storeVerificationCode(email: string): Promise<string> {
  try {
    // Create a secure key from the email
    const secureKey = createSecureKey(email);

    // Generate a verification code
    const verificationCode = generateVerificationCode();

    // Store the code and set expiration
    const expirationTime = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    // Reference to the verification code in Realtime Database
    const verificationRef = ref(realtimeDb, `verificationCodes/${secureKey}`);

    // Store code with expiration time
    await set(verificationRef, {
      code: verificationCode,
      email: email.toLowerCase().trim(), // Store email for validation
      expires: expirationTime,
    });

    return verificationCode;
  } catch (error) {
    console.error("Error storing verification code:", error);
    throw new Error("Failed to store verification code");
  }
}

// Verify a code from Firebase Realtime Database
export async function verifyCode(
  email: string,
  code: string
): Promise<boolean> {
  try {
    // Create a secure key from the email
    const secureKey = createSecureKey(email);

    // Reference to the verification code
    const verificationRef = ref(realtimeDb, `verificationCodes/${secureKey}`);

    // Get the stored code
    const snapshot = await get(verificationRef);

    // Check if the code exists
    if (!snapshot.exists()) {
      console.error("No verification code found for email:", email);
      return false;
    }

    const data = snapshot.val();

    // Check if code has expired
    if (Date.now() > data.expires) {
      console.log("Verification code has expired");
      await remove(verificationRef); // Clean up expired code
      return false;
    }

    // Verify email matches (additional security check)
    if (data.email !== email.toLowerCase().trim()) {
      console.error("Email mismatch during verification");
      return false;
    }

    // Check if code matches
    if (data.code !== code) {
      console.log("Invalid verification code provided");
      return false;
    }

    // Verification successful, clean up the code
    await remove(verificationRef);
    return true;
  } catch (error) {
    console.error("Error verifying code:", error);
    return false;
  }
}

export async function testRealtimeDb() {
  try {
    const testRef = ref(realtimeDb, "test");
    await set(testRef, { time: Date.now() });
    console.log("Firebase Realtime Database connection working");
    return true;
  } catch (error) {
    console.error("Firebase Realtime Database connection error:", error);
    return false;
  }
}

// Mark a user as verified in Firestore
export async function markUserAsVerified(userId: string): Promise<boolean> {
  try {
    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
      emailVerified: true,
      verifiedAt: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error("Error marking user as verified:", error);
    return false;
  }
}
