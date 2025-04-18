// src/app/api/process-reminders/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  ref,
  query,
  orderByChild,
  get,
  update,
  DataSnapshot,
} from "firebase/database";
import { realtimeDb } from "@/lib/firebase";
import { sendQuestionnaireReminderEmail } from "@/lib/email-service";
import { safeCompare } from "@/utils/security";

// This endpoint will be called by a cron job every minute to process reminders
export async function POST(req: NextRequest) {
  try {
    // Simple API key validation
    const apiKey = req.headers.get("x-api-key");

    if (
      !apiKey ||
      !safeCompare(apiKey, process.env.REMINDER_PROCESSOR_API_KEY || "")
    ) {
      console.error("Unauthorized API key");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current time
    const now = Date.now();
    console.log(`Processing reminders at ${new Date(now).toISOString()}`);

    // Query for all pending reminders
    // We'll filter by time and status after getting the data
    const remindersRef = ref(realtimeDb, "questionnaireReminders");
    const snapshot = await get(remindersRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ message: "No reminders in database" });
    }

    // Manually filter reminders that need to be sent now
    const reminders: { key: string; data: any }[] = [];

    snapshot.forEach((childSnapshot: DataSnapshot) => {
      const reminderData = childSnapshot.val();
      // Check if it's pending AND due to be sent
      if (reminderData.status === "pending" && reminderData.sendAt <= now) {
        reminders.push({
          key: childSnapshot.key as string,
          data: reminderData,
        });
      }
    });

    console.log(`Found ${reminders.length} reminders to process`);

    if (reminders.length === 0) {
      return NextResponse.json({ message: "No reminders to process" });
    }

    // Send emails and update statuses
    const results = await Promise.all(
      reminders.map(async (reminder) => {
        try {
          console.log(
            `Processing reminder ${reminder.key} for ${reminder.data.email}`
          );

          // Send the email
          const result = await sendQuestionnaireReminderEmail(
            reminder.data.email,
            reminder.data.reminderNumber
          );

          // Update the reminder status
          if (result.success) {
            console.log(
              `Successfully sent reminder ${reminder.key} to ${reminder.data.email}`
            );

            await update(
              ref(realtimeDb, `questionnaireReminders/${reminder.key}`),
              {
                status: "sent",
                sentAt: now,
              }
            );

            return {
              id: reminder.key,
              status: "sent",
              email: reminder.data.email,
              reminderNumber: reminder.data.reminderNumber,
            };
          } else {
            console.error(
              `Failed to send reminder ${reminder.key}:`,
              result.error
            );

            await update(
              ref(realtimeDb, `questionnaireReminders/${reminder.key}`),
              {
                status: "failed",
                error: result.error || "Failed to send email",
              }
            );

            return {
              id: reminder.key,
              status: "failed",
              error: result.error || "Failed to send email",
            };
          }
        } catch (error) {
          console.error(`Error processing reminder ${reminder.key}:`, error);

          await update(
            ref(realtimeDb, `questionnaireReminders/${reminder.key}`),
            {
              status: "failed",
              error: error instanceof Error ? error.message : "Unknown error",
            }
          );

          return {
            id: reminder.key,
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );

    return NextResponse.json({
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Error processing reminders:", error);
    return NextResponse.json(
      {
        error: "Failed to process reminders",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
