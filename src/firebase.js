// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from 'firebase/database';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBplm3Xt3Mru_Sxi2g3uptgbzXbQ8KZ0Aw",
  authDomain: "bowling-fun.firebaseapp.com",
  databaseURL: "https://bowling-fun-default-rtdb.firebaseio.com",
  projectId: "bowling-fun",
  storageBucket: "bowling-fun.firebasestorage.app",
  messagingSenderId: "1041099466681",
  appId: "1:1041099466681:web:55553970cd19f150dc3868"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export services
export const database = getDatabase(app);
export const auth = getAuth(app);

// Auth providers
export const googleProvider = new GoogleAuthProvider();