// src/lib/firebase-admin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Your service account credentials
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

// Initialize Firebase Admin
function initAdmin() {
  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount)
    });
  }
  
  return {
    db: getFirestore()
  };
}

const adminApp = initAdmin();
export const adminDb = adminApp.db;