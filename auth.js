// Firebase Authentication (email/password) using the free Firebase Web SDK via CDN.
// Config lives in js/config.js. Keep this file as a module (type="module" in index.html).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./config.js";

const configured = !firebaseConfig.apiKey.startsWith("PASTE_");
const app = configured ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;

function setStatus(el, message, type = "") {
  el.textContent = message;
  el.className = "status " + type;
}

function friendlyError(err) {
  const map = {
    "auth/invalid-email": "That email address is not valid.",
    "auth/email-already-in-use": "An account with that email already exists. Try logging in.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/invalid-credential": "Email or password is wrong.",
    "auth/user-not-found": "Email or password is wrong.",
    "auth/wrong-password": "Email or password is wrong.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/network-request-failed": "Network error. Check your connection."
  };
  return map[err.code] || "Something went wrong. Please try again.";
}

const authStatus = document.getElementById("auth-status");
const authPanel = document.getElementById("auth-panel");
const userPanel = document.getElementById("user-panel");
const userEmail = document.getElementById("user-email");
const accountBtn = document.getElementById("account-btn");
const modal = document.getElementById("account-modal");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const logoutBtn = document.getElementById("logout-btn");

function showConfigWarning() {
  setStatus(authStatus, "Accounts are not live yet. Add your Firebase keys in js/config.js (see README).", "error");
}

// Sign up
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!auth) return showConfigWarning();
  const { email, password } = Object.fromEntries(new FormData(signupForm));
  setStatus(authStatus, "Creating account...");
  try {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await sendEmailVerification(credential.user);
    signupForm.reset();
    setStatus(authStatus, "Account created. Check your inbox for the verification link before placing an order.", "ok");
  } catch (err) {
    setStatus(authStatus, friendlyError(err), "error");
  }
});

// Log in
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!auth) return showConfigWarning();
  const { email, password } = Object.fromEntries(new FormData(loginForm));
  setStatus(authStatus, "Logging in...");
  try {
    await signInWithEmailAndPassword(auth, email.trim(), password);
    loginForm.reset();
  } catch (err) {
    setStatus(authStatus, friendlyError(err), "error");
  }
});

// Log out
logoutBtn.addEventListener("click", async () => {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (err) {
    setStatus(authStatus, "Could not log out. Please try again.", "error");
  }
});

// Show logged-in or logged-out state
function renderState(user) {
  if (user) {
    userEmail.textContent = user.email + (user.emailVerified ? "" : " · unverified");
    authPanel.hidden = true;
    userPanel.hidden = false;
    accountBtn.textContent = "My account";
  } else {
    authPanel.hidden = false;
    userPanel.hidden = true;
    accountBtn.textContent = "Log in";
  }
}

if (auth) {
  onAuthStateChanged(auth, (user) => renderState(user));
} else {
  renderState(null);
}

// Expose helper so main.js can open the modal
window.openAccountModal = () => {
  modal.hidden = false;
};
