// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDdTEh5h1qKWh8uby278Q1hnR700tSmfgM",
  authDomain: "hydrasense-a47e8.firebaseapp.com",
  projectId: "hydrasense-a47e8",
  storageBucket: "hydrasense-a47e8.firebasestorage.app",
  messagingSenderId: "545960827136",
  appId: "1:545960827136:web:5a2c22ac3ce700ad13fbe5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
