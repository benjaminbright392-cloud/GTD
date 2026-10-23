/*
 * ==========================================================
 *  FIREBASE CONFIG  -  PASTE YOUR KEYS HERE
 * ==========================================================
 *  The values below are PLACEHOLDERS. Accounts will not work
 *  until you replace them with your own Firebase web config.
 *
 *  Steps (free):
 *  1. Go to https://console.firebase.google.com and create a project.
 *  2. Add a Web app (the </> icon) and copy the firebaseConfig object.
 *  3. Build > Authentication > Get started > enable "Email/Password".
 *  4. Build > Firestore Database > Create database.
 *  5. Paste the values below, replacing each placeholder.
 * ==========================================================
 */
export const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE_YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};

// Shop owner's email. Only this account can open admin.html.
// Must match the email hardcoded in the Firestore rules (see README).
export const ADMIN_EMAIL = "owner@example.com";
