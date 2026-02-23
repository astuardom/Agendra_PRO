import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/core/firebase';
import { Appointment, AppointmentStatus } from '@/shared/types';

const APPOINTMENTS_COLLECTION = 'appointments';

/** Elimina campos undefined para que Firestore no rechace el documento. */
function sanitizeForFirestore<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined) as [string, unknown][]
  ) as Record<string, unknown>;
}

export const createAppointment = async (appointment: Omit<Appointment, 'id' | 'status' | 'createdAt'>) => {
  try {
    const colRef = collection(db, APPOINTMENTS_COLLECTION);
    const payload = sanitizeForFirestore({
      ...appointment,
      notes: appointment.notes ?? null,
      status: AppointmentStatus.PENDING,
      createdAt: serverTimestamp(),
    });
    const docRef = await addDoc(colRef, payload);

    const APPSCRIPT_URL = (window as any)._env_?.VITE_APPSCRIPT_URL || "";
    if (APPSCRIPT_URL) {
      try {
        fetch(APPSCRIPT_URL, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'agenda', appointmentId: docRef.id, ...appointment })
        }).catch(err => console.warn("Sincronización externa fallida:", err));
      } catch (_) {}
    }
    return docRef.id;
  } catch (error) {
    console.error("Error crítico creando cita en Firestore:", error);
    throw error;
  }
};

export const updateAppointmentStatus = async (id: string, status: AppointmentStatus) => {
  const docRef = doc(db, APPOINTMENTS_COLLECTION, id);
  await updateDoc(docRef, { status });
};

export const updateAppointment = async (id: string, data: Partial<Omit<Appointment, 'id' | 'createdAt'>>) => {
  const docRef = doc(db, APPOINTMENTS_COLLECTION, id);
  const payload = sanitizeForFirestore(data as Record<string, unknown>);
  if (Object.keys(payload).length === 0) return;
  await updateDoc(docRef, payload);
};

export const subscribeToAppointments = (callback: (appointments: Appointment[]) => void) => {
  const colRef = collection(db, APPOINTMENTS_COLLECTION);
  const q = query(colRef, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Appointment[];
    callback(appointments);
  }, (error) => {
    console.error("Error en la suscripción de citas:", error);
  });
};
