
export enum AppointmentStatus {
  PENDING = 'pendiente',
  REALIZED = 'realizado',
  NO_SHOW = 'no_asistio'
}

export interface Appointment {
  id?: string;
  patientName: string;
  phone: string;
  email: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  service: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt?: any; // Firestore Timestamp
}
