// src/lib/firebase-storage.ts
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { app } from "./firebase";

// Initialize Firebase Storage with custom settings
export const storage = getStorage(app);
