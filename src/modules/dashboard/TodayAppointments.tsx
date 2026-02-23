import React from 'react';
import { AppointmentStatus, type Appointment } from '@/shared/types';

export interface TodayAppointmentsProps {
  appointments: Appointment[];
  selectedId: string | null;
  onSelectAppointment: (id: string | null) => void;
  emptyMessage?: string;
}

const TodayAppointments: React.FC<TodayAppointmentsProps> = ({
  appointments,
  selectedId,
  onSelectAppointment,
  emptyMessage = 'No hay citas para hoy.',
}) => {
  const sorted = [...appointments].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">today</span>
          Citas de hoy
        </h3>
      </div>
      <div className="p-3 max-h-[280px] overflow-y-auto">
        {sorted.length === 0 ? (
          <p className="text-slate-400 text-sm font-medium py-4 text-center">{emptyMessage}</p>
        ) : (
          <ul className="space-y-2">
            {sorted.map((app) => {
              const statusBg =
                app.status === AppointmentStatus.REALIZED
                  ? 'border-l-emerald-500 bg-emerald-50/50'
                  : app.status === AppointmentStatus.NO_SHOW
                    ? 'border-l-rose-500 bg-rose-50/50'
                    : 'border-l-primary bg-slate-50/50';
              return (
                <li key={app.id}>
                  <button
                    type="button"
                    onClick={() => onSelectAppointment(app.id || null)}
                    className={`w-full text-left p-3 rounded-xl border-l-4 ${statusBg} transition-all ${selectedId === app.id ? 'ring-2 ring-primary' : ''}`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-bold text-slate-800 truncate">{app.patientName}</span>
                      <span className="text-sm font-black text-primary shrink-0">{app.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{app.service}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TodayAppointments;
