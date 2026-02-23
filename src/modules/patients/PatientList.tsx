import React from 'react';
import type { Patient } from '@/shared/types';

export interface PatientListProps {
  patients: Patient[];
  loading: boolean;
  importResult: { added: number; skipped: number } | null;
  importingFromCalendar: boolean;
  onNewPatient: () => void;
  onEditPatient: (p: Patient) => void;
  onDeletePatient: (id: string) => void;
  onImportFromCalendar: () => void;
  appointmentsCount: number;
}

const PatientList: React.FC<PatientListProps> = ({
  patients,
  loading,
  importResult,
  importingFromCalendar,
  onNewPatient,
  onEditPatient,
  onDeletePatient,
  onImportFromCalendar,
  appointmentsCount,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-black text-slate-800">Registro de Pacientes</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onImportFromCalendar}
            disabled={importingFromCalendar || appointmentsCount === 0}
            className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
          >
            {importingFromCalendar ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">calendar_add_on</span>}
            {importingFromCalendar ? 'Importando...' : 'Pasar del calendario'}
          </button>
          <button onClick={onNewPatient} className="flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-sm shadow-md transition-colors">
            <span className="material-symbols-outlined">person_add</span> Nuevo paciente
          </button>
        </div>
      </div>
      {importResult && (
        <div className={`p-4 rounded-xl font-bold text-sm flex items-center gap-2 ${importResult.added > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          {importResult.added > 0 ? <span className="material-symbols-outlined">check_circle</span> : <span className="material-symbols-outlined">info</span>}
          {importResult.added > 0 ? `${importResult.added} paciente(s) añadido(s) desde el calendario` : 'No hay pacientes nuevos en las citas (todos ya están registrados)'}
        </div>
      )}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : patients.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
          <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">person_add</span>
          <p className="text-slate-400 font-bold text-lg">No hay pacientes registrados.</p>
          <p className="text-slate-300 text-sm mt-1">Añade tu primer paciente para comenzar.</p>
          <button onClick={onNewPatient} className="mt-6 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm">Añadir paciente</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((p) => (
            <div key={p.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center"><span className="material-symbols-outlined text-primary">person</span></div>
                <div className="flex gap-2">
                  <button onClick={() => onEditPatient(p)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-primary transition-colors" title="Editar"><span className="material-symbols-outlined text-lg">edit</span></button>
                  <button onClick={() => p.id && onDeletePatient(p.id)} className="p-2 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors" title="Eliminar"><span className="material-symbols-outlined text-lg">delete</span></button>
                </div>
              </div>
              <h3 className="font-black text-slate-800 text-lg mb-1">{p.name}</h3>
              <p className="text-sm text-slate-500 flex items-center gap-2 mb-1"><span className="material-symbols-outlined text-xs">mail</span> {p.email}</p>
              <p className="text-sm text-slate-500 flex items-center gap-2 mb-2"><span className="material-symbols-outlined text-xs">call</span> {p.phone}</p>
              {p.birthDate && <p className="text-xs text-slate-400 flex items-center gap-2 mb-2"><span className="material-symbols-outlined text-xs">cake</span> {p.birthDate}</p>}
              {p.notes && <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 line-clamp-2">{p.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientList;
