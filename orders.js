// Bank-transfer payment verification: client-side format checks, SHA-256 hash, Firestore storage.
// Client-side checks only catch typos. The owner confirms each transfer in their bank app before
// marking it verified in admin.html. Firestore rules enforce who can read or change what.
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./config.js";

const configured = !firebaseConfig.apiKey.startsWith("PASTE_");
const app = configured ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

// Reference format: 8 to 30 letters or digits (covers NIP session IDs, bank trace numbers).
const REF_RE = /^[A-Za-z0-9]{8,30}$/;
const NAME_RE = /^[A-Za-z][A-Za-z '\-.]{1,79}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateOrder({ name, email, productId, amount, reference, tip }, products) {
  const errors = [];
  if (!NAME_RE.test(name || "")) errors.push("Enter a valid full name.");
  if (!EMAIL_RE.test(email || "")) errors.push("Enter a valid email.");
  const product = products.find(p => p.id === productId);
  if (!product) errors.push("Choose a product.");
  else if (product.price == null) errors.push("This product has no price set yet. Contact the shop.");
  const amt = Number(amount);
  const expectedAmount = product && product.price != null ? product.price + (tip ? 10 : 0) : null;
  if (!Number.isInteger(amt) || amt <= 0) errors.push("Amount must be a whole number in naira.");
  else if (product && product.price != null && amt !== expectedAmount)
    errors.push(`Amount must match the product price${tip ? " plus the ₦10 tip" : ""}: NGN ${expectedAmount.toLocaleString("en-NG")}.`);
  if (!REF_RE.test(reference || "")) errors.push("Transfer reference must be 8 to 30 letters or digits.");
  return errors;
}

// SHA-256 over a canonical string of the submission, so tampering is detectable later.
export async function hashSubmission(data) {
  const canonical = JSON.stringify([data.uid, data.name, data.email, data.productId, data.amount, Boolean(data.tip), data.reference.toUpperCase()]);
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function submitOrder(form, products) {
  if (!db) throw new Error("Accounts are not live yet. Add your Firebase keys in js/config.js (see README).");
  const user = auth.currentUser;
  if (!user) throw new Error("Log in before submitting a payment.");
  if (!user.emailVerified) throw new Error("Verify your email using the link we sent before placing an order.");
  const raw = Object.fromEntries(new FormData(form));
  const data = {
    name: raw.name.trim(),
    email: raw.email.trim(),
    productId: raw.product,
    amount: Number(raw.amount),
    reference: raw.reference.trim().toUpperCase()
  };
  const errors = validateOrder(data, products);
  if (errors.length) throw new Error(errors.join(" "));
  const product = products.find(p => p.id === data.productId);
  const hash = await hashSubmission({ ...data, uid: user.uid });
  await addDoc(collection(db, "orders"), {
    uid: user.uid,
    name: data.name,
    email: data.email,
    productId: data.productId,
    productName: product.name,
    amount: data.amount,
    tip: data.tip,
    reference: data.reference,
    hash,
    status: "pending",
    createdAt: serverTimestamp()
  });
  return hash;
}

// Live list of the signed-in user's own orders.
export function watchMyOrders(callback) {
  if (!db || !auth) return () => {};
  let unsub = () => {};
  const stop = onAuthStateChanged(auth, user => {
    unsub();
    if (!user) return callback([]);
    const q = query(collection(db, "orders"), where("uid", "==", user.uid));
    unsub = onSnapshot(q, snap => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      callback(rows);
    });
  });
  return () => { unsub(); stop(); };
}
