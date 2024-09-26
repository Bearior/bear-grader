// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database'; // For Realtime Database
// import { getFirestore } from 'firebase/firestore'; // For Firestore if you prefer
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDZjEEzluYmdwxrU2V08aaF9z7C35tKOKw",
  authDomain: "bear-grader.firebaseapp.com",
  projectId: "bear-grader",
  databaseURL: "https://bear-grader-default-rtdb.asia-southeast1.firebasedatabase.app/", 
  storageBucket: "bear-grader.appspot.com",
  messagingSenderId: "666923817577",
  appId: "1:666923817577:web:1817cacd6f0c0b51cbe0f8",
  measurementId: "G-XMYXKTTENL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database (or Firestore)
export const auth = getAuth(app);
export const db = getDatabase(app);  // Use `getFirestore(app)` if using Firestore