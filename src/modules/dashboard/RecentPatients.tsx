import React from 'react';
import type { Patient } from '@/shared/types';

export interface RecentPatientsProps {
  patients: Patient[];
  limit?: number;
  onViewAll?: () => void;
  onSelectPatient?: (patient: Patient) => void;
  emptyMessage?: string;
}

const RecentPatients: React.FC<RecentPatientsProps> = ({
  patients,
  limit = 5,
  onViewAll,
  onSelectPatient,
  emptyMessage = 'No hay pacientes registrados.',
}) => {
  const list = patients.slice(0, limit);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">person</span>
          Pacientes recientes
        </h3>
        {onViewAll && patients.length > limit && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-bold text-primary hover:underline"
          >
            Ver todos
          </button>
        )}
      </div>
      <div className="p-3 max-h-[280px] overflow-y-auto">
        {list.length === 0 ? (
          <p className="text-slate-400 text-sm font-medium py-4 text-center">{emptyMessage}</p>
        ) : (
          <ul className="space-y-2">
            {list.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onSelectPatient?.(p)}
                  className="w-full text-left p-3 rounded-xl bg-slate-50/50 hover:bg-slate-100/80 border border-transparent hover:border-slate-200 transition-all"
                >
                  <p className="font-bold text-slate-800 truncate">{p.name}</p>
                  <p className="text-xs text-slate-500 truncate">{p.email}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RecentPatients;
