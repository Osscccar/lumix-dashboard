// src/hooks/useWebsitePopup.ts
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useWebsitePopup(userId: string | null | undefined) {
  const searchParams = useSearchParams();
  const [showPopup, setShowPopup] = useState(false);
  const [hasCheckedPopupStatus, setHasCheckedPopupStatus] = useState(false);

  useEffect(() => {
    async function checkPopupStatus() {
      // Only proceed if we have a userId
      if (!userId) {
        setHasCheckedPopupStatus(true);
        return;
      }

      try {
        // First check if the URL parameter is present
        const hasUrlParam = searchParams?.has("came_from_questionnaire_popup");

        if (hasUrlParam) {
          // Check if user has previously seen the popup
          const userDocRef = doc(db, "users", userId);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();

            // Only show popup if user hasn't seen it before
            if (!userData.hasSeenWebsiteCreationPopup) {
              setShowPopup(true);
            }
          } else {
            // If for some reason the user document doesn't exist, show the popup anyway
            setShowPopup(true);
          }
        }
      } catch (error) {
        console.error("Error checking popup status:", error);
      } finally {
        setHasCheckedPopupStatus(true);
      }
    }

    checkPopupStatus();
  }, [userId, searchParams]);

  const closePopup = () => {
    setShowPopup(false);
  };

  return {
    showPopup,
    hasCheckedPopupStatus,
    closePopup,
  };
}
