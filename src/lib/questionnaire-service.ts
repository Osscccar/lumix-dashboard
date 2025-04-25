// src/lib/questionnaire-service.ts
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Save questionnaire progress including current question index
 * @param userId - User ID
 * @param answers - Current questionnaire answers
 * @param currentQuestionIndex - Current question index
 * @returns Promise<boolean> - Success status
 */
export async function saveQuestionnaireProgress(
  userId: string,
  answers: Record<string, any>,
  currentQuestionIndex: number
): Promise<boolean> {
  try {
    const userDocRef = doc(db, "users", userId);

    // Get existing data first
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
      console.error("User document doesn't exist");
      return false;
    }

    const userData = docSnap.data();

    // Create updated answers object, preserving any existing answers
    const updatedAnswers = {
      ...(userData.questionnaireAnswers || {}),
      ...answers,
    };

    // Update the document with the latest answers and current question index
    await updateDoc(userDocRef, {
      questionnaireAnswers: updatedAnswers,
      currentQuestionIndex: currentQuestionIndex,
      questionnaireLastUpdated: new Date().toISOString(),
    });

    console.log(
      `Questionnaire progress saved successfully. Current question: ${currentQuestionIndex}`
    );
    return true;
  } catch (error) {
    console.error("Error saving questionnaire progress:", error);
    return false;
  }
}

/**
 * Save completed questionnaire and mark as done
 * @param userId - User ID
 * @param answers - Final questionnaire answers
 * @returns Promise<boolean> - Success status
 */
export async function saveCompletedQuestionnaire(
  userId: string,
  answers: Record<string, any>
): Promise<boolean> {
  try {
    const userDocRef = doc(db, "users", userId);

    // Mark questionnaire as completed
    await updateDoc(userDocRef, {
      questionnaireAnswers: answers,
      completedQuestionnaire: true,
      questionnaireCompletedAt: new Date().toISOString(),
      currentQuestionIndex: null, // Clear the current question index
    });

    console.log("Questionnaire completed and saved successfully");
    return true;
  } catch (error) {
    console.error("Error saving completed questionnaire:", error);
    return false;
  }
}

/**
 * Get questionnaire progress for a user
 * @param userId - User ID
 * @returns Promise with answers and last question index
 */
export async function getQuestionnaireProgress(userId: string): Promise<{
  answers: Record<string, any>;
  currentQuestionIndex: number | null;
} | null> {
  try {
    const userDocRef = doc(db, "users", userId);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
      return null;
    }

    const userData = docSnap.data();

    return {
      answers: userData.questionnaireAnswers || {},
      currentQuestionIndex: userData.currentQuestionIndex || 0,
    };
  } catch (error) {
    console.error("Error getting questionnaire progress:", error);
    return null;
  }
}

/**
 * Auto-save questionnaire progress with debouncing
 * @param userId - User ID
 * @param answers - Current answers
 * @param currentQuestionIndex - Current question index
 * @returns Promise<void>
 */
let saveTimer: NodeJS.Timeout | null = null;

export async function autoSaveQuestionnaireProgress(
  userId: string,
  answers: Record<string, any>,
  currentQuestionIndex: number
): Promise<void> {
  // Clear any existing timer
  if (saveTimer) {
    clearTimeout(saveTimer);
  }

  // Set a new timer
  saveTimer = setTimeout(async () => {
    try {
      await saveQuestionnaireProgress(userId, answers, currentQuestionIndex);
      console.log("Auto-saved questionnaire progress");
    } catch (error) {
      console.error("Error auto-saving questionnaire:", error);
    }
  }, 1500); // 1.5 second debounce
}

// Function to send an immediate reminder email via API endpoint
export async function sendImmediateQuestionnaireMail(
  userId: string,
  email: string
): Promise<boolean> {
  try {
    console.log(`Sending immediate reminder email to ${email}`);

    // Make sure we use the full URL path
    const response = await fetch("/api/send-reminder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, email }),
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error("API error response:", responseText);
      return false;
    }

    try {
      const data = await response.json();
      if (!data.success) {
        console.error("API returned error:", data.error);
        return false;
      }
    } catch (jsonError) {
      console.error("Error parsing API response:", jsonError);
      return false;
    }

    console.log("Email sent successfully via API");
    return true;
  } catch (error) {
    console.error("Error sending questionnaire email:", error);
    return false;
  }
}
