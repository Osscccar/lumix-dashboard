// src/lib/auth-service.ts
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { UserData, QuestionnaireAnswers } from "@/types";

// Get user data from Firestore
export async function getUserData(userId: string): Promise<UserData | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));

    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }

    return null;
  } catch (error: unknown) {
    console.error(
      "Error getting user data:",
      error instanceof Error ? error.message : String(error)
    );
    return null;
  }
}

// Create or update user data from OAuth provider (Google)
export async function createOrUpdateUserFromOAuth(
  userId: string,
  userData: {
    email: string;
    displayName?: string | null;
    photoURL?: string | null;
    phoneNumber?: string | null;
  }
): Promise<boolean> {
  try {
    console.log(`Creating/updating user data for OAuth user ${userId}`);

    // Check if user document already exists
    const userDoc = await getDoc(doc(db, "users", userId));

    if (userDoc.exists()) {
      // User exists, update last login or other fields if needed
      await updateDoc(doc(db, "users", userId), {
        lastLogin: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log("Existing OAuth user updated successfully");
      return true;
    }

    // Extract first and last name from display name
    let firstName = "";
    let lastName = "";

    if (userData.displayName) {
      const nameParts = userData.displayName.split(" ");
      firstName = nameParts[0] || "";
      lastName = nameParts.slice(1).join(" ") || "";
    }

    // Create new user document
    const newUserData: UserData = {
      email: userData.email,
      firstName: firstName,
      lastName: lastName,
      phoneNumber: userData.phoneNumber || "",
      hasPaid: false,
      completedQuestionnaire: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      authProvider: "google", // Mark that this user came from Google OAuth
    };

    await setDoc(doc(db, "users", userId), newUserData);

    console.log("New OAuth user created successfully");
    return true;
  } catch (error: unknown) {
    console.error(
      "Error creating/updating OAuth user:",
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
}

// Update user payment status
export async function updateUserPaymentStatus(
  userId: string,
  stripeCustomerId: string
): Promise<boolean> {
  try {
    console.log(
      `Updating payment status for user ${userId} with stripe ID ${stripeCustomerId}`
    );

    // First check if user document exists
    const userDoc = await getDoc(doc(db, "users", userId));

    if (!userDoc.exists()) {
      console.error("User document does not exist in Firestore");
      return false;
    }

    // Update the document
    await updateDoc(doc(db, "users", userId), {
      hasPaid: true,
      subscriptionStatus: "active", // Add this field
      stripeCustomerId,
      updatedAt: new Date().toISOString(),
    });

    console.log("User payment status updated successfully");
    return true;
  } catch (error: unknown) {
    console.error(
      "Error updating user payment status:",
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
}

// Save questionnaire answers
export async function saveQuestionnaireAnswers(
  userId: string,
  answers: QuestionnaireAnswers
): Promise<boolean> {
  try {
    console.log("Saving questionnaire answers for user:", userId);
    console.log("Answers:", JSON.stringify(answers, null, 2));

    // Get the current user data
    const userData = await getUserData(userId);

    // If user already has questionnaire answers, merge with the new ones
    // This preserves answers to questions the user might have skipped this time
    let mergedAnswers = answers;
    if (userData?.questionnaireAnswers) {
      mergedAnswers = {
        ...userData.questionnaireAnswers,
        ...answers,
      };
    }

    // Update the document
    await updateDoc(doc(db, "users", userId), {
      questionnaireAnswers: mergedAnswers,
      completedQuestionnaire: true,
      updatedAt: new Date().toISOString(),
    });

    console.log("Questionnaire answers saved successfully");
    return true;
  } catch (error: unknown) {
    console.error(
      "Error saving questionnaire answers:",
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
}

// Save partial questionnaire answers (for auto-saving)
export async function savePartialQuestionnaireAnswers(
  userId: string,
  answers: QuestionnaireAnswers
): Promise<boolean> {
  try {
    // Get the current user data
    const userData = await getUserData(userId);

    // If user already has questionnaire answers, merge with the new ones
    let mergedAnswers = answers;
    if (userData?.questionnaireAnswers) {
      mergedAnswers = {
        ...userData.questionnaireAnswers,
        ...answers,
      };
    }

    // Update the document but don't mark as completed
    await updateDoc(doc(db, "users", userId), {
      questionnaireAnswers: mergedAnswers,
      updatedAt: new Date().toISOString(),
    });

    return true;
  } catch (error: unknown) {
    console.error(
      "Error saving partial questionnaire answers:",
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
}

// Update user subscription status
export async function updateSubscriptionStatus(
  userId: string,
  status: "active" | "canceled" | "suspended"
): Promise<boolean> {
  try {
    console.log(`Updating subscription status for user ${userId} to ${status}`);

    await updateDoc(doc(db, "users", userId), {
      subscriptionStatus: status,
      updatedAt: new Date().toISOString(),
    });

    console.log(`Subscription status updated to ${status} successfully`);
    return true;
  } catch (error: unknown) {
    console.error(
      "Error updating subscription status:",
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
}
