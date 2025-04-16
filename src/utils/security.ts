// src/utils/security.ts
import { timingSafeEqual } from "crypto";

export function safeCompare(a: string, b: string): boolean {
  if (!a || !b) {
    return false;
  }

  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);

    // If lengths differ, create a new buffer of the same length for constant-time comparison
    if (bufA.length !== bufB.length) {
      // Still perform the comparison to prevent timing attack, but return false
      const bufC = Buffer.alloc(bufA.length);
      return timingSafeEqual(bufA, bufC) && false;
    }

    return timingSafeEqual(bufA, bufB);
  } catch (error) {
    console.error("Error in safe comparison:", error);
    return false;
  }
}
