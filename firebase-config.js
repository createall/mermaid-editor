// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
// Analytics is optional, we can add it if needed but it's not required for the core features
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBrqlgCJrZiuJ0NYje9n-Bqht66PRGtLPQ",
    authDomain: "mermaid-diagram-editor.firebaseapp.com",
    projectId: "mermaid-diagram-editor",
    storageBucket: "mermaid-diagram-editor.firebasestorage.app",
    messagingSenderId: "910034829022",
    appId: "1:910034829022:web:d3627cda4dbb6b525a8c4f",
    measurementId: "G-C4HMPRVZY0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export { auth, db, googleProvider, githubProvider, analytics };
