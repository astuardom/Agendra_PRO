import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC3WKadNIrC0aaFPabPDOzN8_Pc-hx5TSE",
  authDomain: "agenda-veti.firebaseapp.com",
  projectId: "agenda-veti",
  storageBucket: "agenda-veti.firebasestorage.app",
  messagingSenderId: "252513036838",
  appId: "1:252513036838:web:83e6435de3fd9e5bef94e7",
  measurementId: "G-6FWD6LFH6W"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
