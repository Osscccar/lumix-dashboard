// src/app/api/generate-website/route.ts
import { NextRequest, NextResponse } from "next/server";
import { processQuestionnaireFor10Web } from "@/lib/tenweb-service";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Redis } from "@upstash/redis";
import {
  logWebsiteGeneration,
  updateGenerationStatus,
  hasExistingWebsite,
} from "@/lib/tenweb-utils";

// Initialize Redis client (same as in middleware.ts)
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Rate limit key prefix
const RATE_LIMIT_KEY = "tenweb-site-generation";
// Monthly limit (60 websites per month)
const MONTHLY_LIMIT = 60;

export async function POST(request: NextRequest) {
  try {
    // Rate limit implementation using Redis
    if (redis) {
      // Create a monthly counter key with year/month
      const date = new Date();
      const monthKey = `${RATE_LIMIT_KEY}:${date.getFullYear()}-${
        date.getMonth() + 1
      }`;

      // Get current count before incrementing (to check if we're at the limit)
      const currentCount = (await redis.get(monthKey)) || 0;

      // Check if over monthly limit
      if (Number(currentCount) >= MONTHLY_LIMIT) {
        return NextResponse.json(
          { success: false, error: "Monthly website generation limit reached" },
          { status: 429 }
        );
      }
    }

    // Parse request body
    const { userId, questionnaireAnswers } = await request.json();

    if (!userId || !questionnaireAnswers) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Prevent duplicate website generation
    const hasExisting = await hasExistingWebsite(userId);
    if (hasExisting) {
      return NextResponse.json(
        { success: false, error: "User already has a generated website" },
        { status: 409 } // Conflict status code
      );
    }

    // Log the generation attempt to Firestore for tracking
    const generationId = await logWebsiteGeneration(userId, {
      businessName: questionnaireAnswers.businessName,
      businessCategory: questionnaireAnswers.businessCategory,
      processingStarted: true,
    });

    // Only now increment the rate limit counter (after validations)
    if (redis) {
      const date = new Date();
      const monthKey = `${RATE_LIMIT_KEY}:${date.getFullYear()}-${
        date.getMonth() + 1
      }`;

      // Increment counter
      await redis.incr(monthKey);

      // Set expiry on first time (make it expire at the end of the current month)
      if (Number(await redis.get(monthKey)) === 1) {
        const lastDayOfMonth = new Date(
          date.getFullYear(),
          date.getMonth() + 1,
          0
        ).getDate();
        const daysRemaining = lastDayOfMonth - date.getDate();
        const secondsRemaining = daysRemaining * 24 * 60 * 60;
        await redis.expire(monthKey, secondsRemaining);
      }
    }

    // Process the questionnaire data with 10web
    const result = await processQuestionnaireFor10Web(questionnaireAnswers);

    if (result.success && result.url) {
      // Update user document with the website URL
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        websiteUrl: result.url,
        websiteGeneratedAt: new Date().toISOString(),
      });

      // Update generation log with success
      if (generationId) {
        await updateGenerationStatus(generationId, "completed", {
          websiteUrl: result.url,
        });
      }

      return NextResponse.json({ success: true, url: result.url });
    } else {
      // Update generation log with failure
      if (generationId) {
        await updateGenerationStatus(generationId, "failed", {
          error: "Failed to generate website",
        });
      }

      return NextResponse.json(
        { success: false, error: "Failed to generate website" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in generate-website API:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
