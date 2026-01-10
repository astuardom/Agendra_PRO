
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
import { db } from '../firebase';
import { Appointment, AppointmentStatus } from '../types';

const APPOINTMENTS_COLLECTION = 'appointments';

export const createAppointment = async (appointment: Omit<Appointment, 'id' | 'status' | 'createdAt'>) => {
  try {
    const colRef = collection(db, APPOINTMENTS_COLLECTION);
    const docRef = await addDoc(colRef, {
      ...appointment,
      status: AppointmentStatus.PENDING,
      createdAt: serverTimestamp(),
    });

    const APPSCRIPT_URL = (window as any)._env_?.VITE_APPSCRIPT_URL || "";
    
    if (APPSCRIPT_URL) {
      try {
        fetch(APPSCRIPT_URL, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'agenda',
            appointmentId: docRef.id,
            ...appointment
          })
        }).catch(err => console.warn("Sincronización externa fallida:", err));
      } catch (e) {
        // Silent fail
      }
    }

    return docRef.id;
  } catch (error) {
    console.error("Error crítico creando cita en Firestore:", error);
    throw error;
  }
};

export const updateAppointmentStatus = async (id: string, status: AppointmentStatus) => {
  try {
    const docRef = doc(db, APPOINTMENTS_COLLECTION, id);
    await updateDoc(docRef, { status });
  } catch (error) {
    console.error("Error actualizando estado de cita:", error);
    throw error;
  }
};

export const subscribeToAppointments = (callback: (appointments: Appointment[]) => void) => {
  const colRef = collection(db, APPOINTMENTS_COLLECTION);
  const q = query(colRef, orderBy("createdAt", "desc"));

  return onSnapshot(q, (snapshot) => {
    const appointments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Appointment[];
    callback(appointments);
  }, (error) => {
    console.error("Error en la suscripción de citas:", error);
  });
};
