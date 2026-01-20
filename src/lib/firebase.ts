// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// ✅ Your Firebase configuration (kept exactly as you provided)
const firebaseConfig = {
  apiKey: "AIzaSyAixB_H84GpLpCbuVFbTuzYjT6EZUUv4AQ",
  authDomain: "samvedanafoundation-1ae98.firebaseapp.com",
  projectId: "samvedanafoundation-1ae98",
  storageBucket: "samvedanafoundation-1ae98.appspot.com",
  messagingSenderId: "422436144524",
  appId: "1:422436144524:web:4c06f2bb456f2f9eca42a9",
  measurementId: "G-JR78RD0EM2",
};

// ✅ Always initialize Firebase with your config
let app;
let auth: Auth;
let db: Firestore;
let firebaseIsConfigured = false;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  firebaseIsConfigured = true;
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
  firebaseIsConfigured = false;
}

export { auth, db, firebaseIsConfigured };

/**
 * Authority Collection Structure:
 * Document ID: mobile_number (string)
 * Fields:
 * - mobile_number: string
 * - name: string
 * - password: string (Note: In production, passwords should be hashed server-side)
 * - role: string (must be "Administrator" for admin access)
 *
 * SECURITY RECOMMENDATIONS:
 * 1. Implement server-side password hashing and validation
 * 2. Use Firebase Auth for proper authentication instead of client-side password validation
 * 3. Add proper Firestore security rules to restrict access to Authority collection
 * 4. Consider implementing JWT tokens for session management
 */
