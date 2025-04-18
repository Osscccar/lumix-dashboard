// src/lib/questionnaire-service.ts
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db, realtimeDb } from "./firebase";
import { ref, set } from "firebase/database";

// Function to mark user for later reminder emails
export async function scheduleQuestionnaireReminders(
  userId: string,
  email: string
): Promise<boolean> {
  try {
    // Calculate reminder times
    const now = new Date();

    // First reminder: Current time + 2 minutes (for testing)
    const firstReminderTime = new Date(now.getTime() + 2 * 60 * 1000);

    // Second reminder: Current time + 10 minutes (for testing)
    const secondReminderTime = new Date(now.getTime() + 10 * 60 * 1000);

    // Store in Firestore - Update the user document to mark reminders as scheduled
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      questionnaireReminderStatus: "scheduled",
      firstReminderTime: firstReminderTime.toISOString(),
      secondReminderTime: secondReminderTime.toISOString(),
      questionnairePostponed: true, // Add this flag to indicate user chose to do it later
      updatedAt: new Date().toISOString(),
    });

    // Also create entries in Realtime Database for Cloud Functions to process
    const firstReminderId = `reminder_${userId}_1`;
    const secondReminderId = `reminder_${userId}_2`;

    // First reminder
    await set(ref(realtimeDb, `questionnaireReminders/${firstReminderId}`), {
      userId,
      email,
      reminderNumber: 1,
      sendAt: firstReminderTime.getTime(),
      createdAt: now.getTime(),
      status: "pending",
    });

    // Second reminder
    await set(ref(realtimeDb, `questionnaireReminders/${secondReminderId}`), {
      userId,
      email,
      reminderNumber: 2,
      sendAt: secondReminderTime.getTime(),
      createdAt: now.getTime(),
      status: "pending",
    });

    return true;
  } catch (error) {
    console.error("Error scheduling questionnaire reminders:", error);
    return false;
  }
}

// Function to switch to production timing (2 hours and 1 day)
export async function switchToProductionTiming(
  userId: string,
  email: string
): Promise<boolean> {
  try {
    // Get the existing reminder entries
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    // Calculate production reminder times
    const now = new Date();

    // First reminder: Current time + 2 hours
    const firstReminderTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Second reminder: Current time + 1 day
    const secondReminderTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Update in Firestore
    await updateDoc(userRef, {
      firstReminderTime: firstReminderTime.toISOString(),
      secondReminderTime: secondReminderTime.toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Update entries in Realtime Database
    const firstReminderId = `reminder_${userId}_1`;
    const secondReminderId = `reminder_${userId}_2`;

    // First reminder
    await set(ref(realtimeDb, `questionnaireReminders/${firstReminderId}`), {
      userId,
      email,
      reminderNumber: 1,
      sendAt: firstReminderTime.getTime(),
      createdAt: now.getTime(),
      status: "pending",
    });

    // Second reminder
    await set(ref(realtimeDb, `questionnaireReminders/${secondReminderId}`), {
      userId,
      email,
      reminderNumber: 2,
      sendAt: secondReminderTime.getTime(),
      createdAt: now.getTime(),
      status: "pending",
    });

    return true;
  } catch (error) {
    console.error("Error switching to production timing:", error);
    return false;
  }
}
