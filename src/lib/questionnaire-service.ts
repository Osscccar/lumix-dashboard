// src/lib/questionnaire-service.ts
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
