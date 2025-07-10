// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Import getFirestore
import { getAuth } from "firebase/auth";     // Import getAuth
// If you enabled Analytics, keep this line:
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD8xdWiL2VEFadqGbNTIP_O61RW4FAdkyY",
  authDomain: "feedback-portal-6ac4e.firebaseapp.com",
  projectId: "feedback-portal-6ac4e",
  storageBucket: "feedback-portal-6ac4e.firebasestorage.app",
  messagingSenderId: "922581608382",
  appId: "1:922581608382:web:9ef2b8e279f15c8ade7bef",
  measurementId: "G-W6Q1ZCH4MF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// If you enabled Analytics, initialize it:
// const analytics = getAnalytics(app);

// Initialize Firestore and Auth
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
