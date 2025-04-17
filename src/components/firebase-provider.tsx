"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase"; // Import from centralized file

// Firebase context type
type FirebaseContextType = {
  user: User | null;
  userData: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, userData: any) => Promise<User>;
  logout: () => Promise<void>;
  isVerified?: boolean;
  verificationEmail?: string;
  sendVerificationCode?: (email: string) => Promise<boolean>;
  verifyCode?: (email: string, code: string) => Promise<boolean>;
};

// Create Firebase context
const FirebaseContext = createContext<FirebaseContextType | null>(null);

// Custom hook to use Firebase
export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
};

// Get user data from Firestore
const getUserData = async (uid: string) => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

// Firebase provider component
export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [verificationEmail, setVerificationEmail] = useState<string>("");

  // Sign in function
  const signIn = async (email: string, password: string): Promise<User> => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  // Sign up function with improved error handling
  const signUp = async (
    email: string,
    password: string,
    userData: any
  ): Promise<User> => {
    try {
      // Step 1: Create the auth user
      console.log("Creating auth user...");
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = result.user;
      console.log("Auth user created successfully:", user.uid);

      // Step 2: Create the Firestore document with user data
      console.log("Creating Firestore document...");
      const userDocData = {
        email,
        ...userData,
        hasPaid: false,
        subscriptionStatus: "pending", // Set initial subscription status
        completedQuestionnaire: false,
        createdAt: new Date().toISOString(),
      };

      // Log the exact data being saved
      console.log("Document data to save:", userDocData);

      // Create the document
      await setDoc(doc(db, "users", user.uid), userDocData);
      console.log("Firestore document created successfully");

      return user;
    } catch (error) {
      // Log the full error with stack trace
      console.error("Error during sign-up process:", error);

      throw error; // Re-throw to let the calling code handle it
    }
  };

  const sendVerificationCode = async (email: string) => {
    try {
      const response = await fetch("/api/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send verification code");
      }

      setVerificationEmail(email);
      return true;
    } catch (error) {
      console.error("Error sending verification code:", error);
      return false;
    }
  };

  const verifyCode = async (email: string, code: string) => {
    try {
      const response = await fetch("/api/send-verification", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify code");
      }

      setIsVerified(true);
      return true;
    } catch (error) {
      console.error("Error verifying code:", error);
      return false;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    await auth.signOut();
  };

  // Watch auth state
  useEffect(() => {
    console.log("Firebase Provider mounting");

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log(
        "Auth state changed:",
        user ? "User authenticated" : "No user"
      );
      setUser(user);

      if (user) {
        const data = await getUserData(user.uid);
        console.log(
          "User data from Firestore:",
          data ? "Data found" : "No data found"
        );
        setUserData(data);
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <FirebaseContext.Provider
      value={{
        user,
        userData,
        isVerified,
        verificationEmail,
        sendVerificationCode,
        verifyCode,
        loading,
        signIn,
        signUp,
        logout,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};
