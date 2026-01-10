import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/**
 * Configuración de Firebase para Agenda Pro.
 * IMPORTANTE: Se utiliza la Web API Key específica de este proyecto de Firebase.
 * La clave process.env.API_KEY del entorno está configurada para Gemini y no es válida para Firebase Auth.
 */
const firebaseConfig = {
  apiKey: "AIzaSyArL0vzQTC3WKVtfv6sIesJLp4DCQ_Hxkw",
  authDomain: "agendapro-1e3d8.firebaseapp.com",
  projectId: "agendapro-1e3d8",
  storageBucket: "agendapro-1e3d8.firebasestorage.app",
  messagingSenderId: "744378486936",
  appId: "1:744378486936:web:3da87c72464952b60d00ed",
  measurementId: "G-CFHD0MRTP6"
};

// Inicialización con patrón singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
