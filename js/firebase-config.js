// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC3GsiFXpqRlEy_W88qsusjcAmlIw7gZXw",
  authDomain: "vivomejor-walaz05.firebaseapp.com",
  projectId: "vivomejor-walaz05",
  storageBucket: "vivomejor-walaz05.firebasestorage.app",
  messagingSenderId: "967699044740",
  appId: "1:967699044740:web:172c7c293dddebede1a5d1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
