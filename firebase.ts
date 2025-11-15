
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBqHAr-VX41AaHj5YIL9E3qjy98H3fbZvg",
  authDomain: "invoice-ai-7f9f5.firebaseapp.com",
  projectId: "invoice-ai-7f9f5",
  storageBucket: "invoice-ai-7f9f5.firebasestorage.app",
  messagingSenderId: "840098157464",
  appId: "1:840098157464:web:b89b53953d7cc8475b11ed",
  measurementId: "G-JJC59GREEH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
