import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Configuración de Firebase para Agenda Pro.
 * IMPORTANTE: Se utiliza la Web API Key específica de este proyecto de Firebase.
 * La clave process.env.API_KEY del entorno está configurada para Gemini y no es válida para Firebase Auth.
 */
const firebaseConfig = {
  apiKey: "AIzaSyC3WKadNIrC0aaFPabPDOzN8_Pc-hx5TSE",
  authDomain: "agenda-veti.firebaseapp.com",
  projectId: "agenda-veti",
  storageBucket: "agenda-veti.firebasestorage.app",
  messagingSenderId: "252513036838",
  appId: "1:252513036838:web:83e6435de3fd9e5bef94e7",
  measurementId: "G-6FWD6LFH6W"
};

// Inicialización con patrón singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
