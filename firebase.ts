
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate that all required environment variables are present
for (const [key, value] of Object.entries(firebaseConfig)) {
  if (value === undefined) {
    throw new Error(`Firebase config is missing required environment variable: ${key}. Make sure your .env file is correctly set up.`);
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Firestore with settings to improve connectivity in diverse environments
// We use initializeFirestore instead of getFirestore to pass specific settings
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // Forces long polling, which is more robust in restricted networks/cloud IDEs
});

// Persistence is disabled for now to rule out locking issues during debugging.
// You can re-enable it later if needed.

export { app, auth, db };
