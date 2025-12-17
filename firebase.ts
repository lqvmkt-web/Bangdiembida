// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyC5HbMI7YAqv-Xd1CRiKfjIoVjszBWxZ24",
  authDomain: "bangdiembida.firebaseapp.com",
  projectId: "bangdiembida",
  storageBucket: "bangdiembida.firebasestorage.app",
  messagingSenderId: "189720940280",
  appId: "1:189720940280:web:282a43acdf46235781f50d",
  measurementId: "G-TVRZ7F5Y60"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;