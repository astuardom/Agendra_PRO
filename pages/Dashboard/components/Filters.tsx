import React from 'react';
import { AppointmentStatus } from '../../../types';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todas' },
  { value: AppointmentStatus.PENDING, label: 'Pend.' },
  { value: AppointmentStatus.REALIZED, label: 'Realiz.' },
  { value: AppointmentStatus.NO_SHOW, label: 'No asist.' },
] as const;

export interface FiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterService: string;
  onServiceChange: (value: string) => void;
  filterStatus: string;
  onStatusChange: (status: string) => void;
  services: readonly string[];
  /** Solo en variante mobile: toggle Lista / Calendario */
  variant?: 'sidebar' | 'mobile';
  calendarViewMode?: 'month' | 'week' | 'list';
  onViewModeChange?: (mode: 'list' | 'month') => void;
  /** Solo mobile: botón Crear cita */
  onCreateClick?: () => void;
}

const Filters: React.FC<FiltersProps> = ({
  searchTerm,
  onSearchChange,
  filterService,
  onServiceChange,
  filterStatus,
  onStatusChange,
  services,
  variant = 'sidebar',
  calendarViewMode,
  onViewModeChange,
  onCreateClick,
}) => {
  const isMobile = variant === 'mobile';

  return (
    <div className={isMobile ? 'flex flex-col gap-3 p-4 border-b border-slate-100 bg-slate-50/50' : 'space-y-3'}>
      {isMobile && onCreateClick && (
        <button
          onClick={onCreateClick}
          className="flex w-full items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-bold text-sm"
        >
          <span className="material-symbols-outlined">add</span> Crear cita
        </button>
      )}
      <div className={isMobile ? 'w-full' : 'relative'}>
        {!isMobile && (
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">person_search</span>
        )}
        <input
          type="text"
          placeholder="Buscar paciente, email, servicio..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none ${isMobile ? 'px-4 lg:pl-10' : ''}`}
        />
      </div>
      <div>
        {!isMobile && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Servicio</p>}
        <select
          value={filterService}
          onChange={(e) => onServiceChange(e.target.value)}
          className={`w-full rounded-lg border border-slate-200 py-2 px-3 text-xs font-bold text-slate-700 ${isMobile ? 'rounded-xl py-2.5 px-4 text-sm' : ''}`}
        >
          <option value="">{isMobile ? 'Todos los servicios' : 'Todos'}</option>
          {services.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        {!isMobile && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Estado</p>}
        <div className={`flex flex-wrap gap-1.5 ${isMobile ? 'gap-2 overflow-x-auto pb-1' : ''}`}>
          {STATUS_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onStatusChange(value)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                filterStatus === value ? 'bg-primary text-white' : isMobile ? 'bg-white border border-slate-200 text-slate-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              } ${isMobile ? 'text-xs' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {isMobile && onViewModeChange && calendarViewMode !== undefined && (
        <div className="flex gap-2">
          {(['list', 'month'] as const).map((m) => (
            <button
              key={m}
              onClick={() => onViewModeChange(m)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold ${calendarViewMode === m ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
            >
              {m === 'list' ? 'Lista' : 'Calendario'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Filters;
