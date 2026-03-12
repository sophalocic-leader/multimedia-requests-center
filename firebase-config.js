import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// TODO: Replace with real Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export for app.js
window.firebaseAuth = auth;
window.firebaseDb = db;

// DOM Elements
const loginOverlay = document.getElementById('login-overlay');
const appContent = document.getElementById('app-content');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');

const userNameDisplay = document.getElementById('user-name');
const userAvatarDisplay = document.getElementById('user-avatar');
const userAvatarPlaceholder = document.getElementById('user-avatar-placeholder');

// Authentication State Observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in.
        loginOverlay.style.display = 'none';
        appContent.style.display = 'flex';
        
        // Update UI with user info
        userNameDisplay.textContent = user.displayName;
        if (user.photoURL) {
            userAvatarDisplay.src = user.photoURL;
            userAvatarDisplay.style.display = 'block';
            userAvatarPlaceholder.style.display = 'none';
        }
        
        // Notify main app to load requests if needed
        if (typeof window.onUserLogin === 'function') {
            window.onUserLogin(user);
        }
    } else {
        // User is signed out.
        loginOverlay.style.display = 'flex';
        appContent.style.display = 'none';
        
        userNameDisplay.textContent = 'Loading...';
        userAvatarDisplay.style.display = 'none';
        userAvatarPlaceholder.style.display = 'flex';
    }
});

// Login Handlers
btnLogin.addEventListener('click', () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .catch((error) => {
            console.error("Login failed:", error);
            alert("Login failed: " + error.message);
        });
});

btnLogout.addEventListener('click', () => {
    signOut(auth).catch((error) => {
        console.error("Sign out error", error);
    });
});
