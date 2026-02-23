import {
  collection,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { Patient } from '../types';

const PATIENTS_COLLECTION = 'patients';

export const createPatient = async (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
  const colRef = collection(db, PATIENTS_COLLECTION);
  const docRef = await addDoc(colRef, {
    ...patient,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updatePatient = async (id: string, data: Partial<Omit<Patient, 'id' | 'createdAt'>>) => {
  const docRef = doc(db, PATIENTS_COLLECTION, id);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
};

export const deletePatient = async (id: string) => {
  const docRef = doc(db, PATIENTS_COLLECTION, id);
  await deleteDoc(docRef);
};

export const subscribeToPatients = (callback: (patients: Patient[]) => void) => {
  const colRef = collection(db, PATIENTS_COLLECTION);
  const q = query(colRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const patients = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Patient[];
      callback(patients);
    },
    (err) => console.error('Error suscripción pacientes:', err)
  );
};
