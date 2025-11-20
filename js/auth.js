
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup,
    signOut
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { auth } from "./firebase-config.js";

export function initAuth(onLogin, onLogout) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            onLogin(user);
        } else {
            onLogout();
        }
    });
}

export async function loginWithEmail(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
        console.error("Login Error:", err);
        throw err;
    }
}

export async function registerWithEmail(email, password) {
    try {
        await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
        console.error("Registration Error:", err);
        throw err;
    }
}

export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (err) {
        console.error("Reset Password Error:", err);
        throw err;
    }
}

export async function loginWithGoogle() {
    try {
        await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
        console.error("Google Login Error:", err);
        throw err;
    }
}

export async function logout() {
    try {
        await signOut(auth);
    } catch (err) {
        console.error("Logout Error:", err);
        throw err;
    }
}
