import { initializeApp } from "firebase/app";
import * as Auth from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyALRxdlH36j5nyh8x1QCyrAt-_5Q6uD_sg",
  authDomain: "hakawati-4baa4.firebaseapp.com",
  projectId: "hakawati-4baa4",
  storageBucket: "hakawati-4baa4.firebasestorage.app",
  messagingSenderId: "262067026926",
  appId: "1:262067026926:web:0f6d00d70773a82e23acff"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = Auth.getAuth(app);
export const googleProvider = new Auth.GoogleAuthProvider();
export const db = getFirestore(app);