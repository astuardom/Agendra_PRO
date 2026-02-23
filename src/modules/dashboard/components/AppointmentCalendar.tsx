import React from 'react';
import { AppointmentStatus, type Appointment } from '@/shared/types';
import Filters from './Filters';

export interface CalendarCell {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
}

export interface WeekCell {
  date: Date;
  dateStr: string;
}

export interface AppointmentCalendarProps {
  loading: boolean;
  calendarViewMode: 'month' | 'week' | 'list';
  onViewModeChange: (mode: 'month' | 'week' | 'list') => void;
  viewDate: Date;
  goToToday: () => void;
  goToMonth: (offset: number) => void;
  goToWeek: (offset: number) => void;
  filterDate: string;
  onFilterDateChange: (dateStr: string) => void;
  onViewDateChange: (date: Date) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterService: string;
  onServiceChange: (value: string) => void;
  filterStatus: string;
  onStatusChange: (value: string) => void;
  services: readonly string[];
  filteredApps: Appointment[];
  groupedAppointmentsForList: [string, Appointment[]][];
  appointmentsByDate: Record<string, Appointment[]>;
  calendarCells: CalendarCell[];
  weekCells: WeekCell[];
  todayISO: string;
  labelDate: (dateISO: string) => string;
  onCreateClick: (dateStr?: string) => void;
  onSelectAppointment: (id: string | null) => void;
  selectedId: string | null;
  hoveredAppId: string | null;
  onHoverAppointment: (id: string | null) => void;
  monthNames: string[];
  weekdayShort: string[];
  onClearFilters?: () => void;
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  loading,
  calendarViewMode,
  onViewModeChange,
  viewDate,
  goToToday,
  goToMonth,
  goToWeek,
  filterDate,
  onFilterDateChange,
  onViewDateChange,
  searchTerm,
  onSearchChange,
  filterService,
  onServiceChange,
  filterStatus,
  onStatusChange,
  services,
  filteredApps,
  groupedAppointmentsForList,
  appointmentsByDate,
  calendarCells,
  weekCells,
  todayISO,
  labelDate,
  onCreateClick,
  onSelectAppointment,
  selectedId,
  hoveredAppId,
  onHoverAppointment,
  monthNames,
  weekdayShort,
  onClearFilters,
}) => {
  const renderMiniCalendar = () => {
    const month = viewDate.getMonth();
    const year = viewDate.getFullYear();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];
    const startOffset = (firstDay + 6) % 7;
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

    return (
      <div className="p-4 w-full">
        <div className="flex justify-between items-center mb-3">
          <button onClick={() => goToMonth(-1)} className="p-1 hover:bg-slate-100 rounded transition-colors">
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <span className="text-xs font-bold text-slate-700">{monthNames[month]} {year}</span>
          <button onClick={() => goToMonth(1)} className="p-1 hover:bg-slate-100 rounded transition-colors">
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {weekdayShort.map((d) => (
            <div key={d} className="text-[9px] font-bold text-slate-400 py-1">{d}</div>
          ))}
          {days.map((date, idx) => {
            if (!date) return <div key={idx} />;
            const dateStr = date.toISOString().split('T')[0];
            const isSelected = filterDate === dateStr;
            const isToday = dateStr === todayISO;
            return (
              <button
                key={idx}
                onClick={() => { onFilterDateChange(dateStr); onViewDateChange(new Date(date)); }}
                className={`aspect-square text-[11px] font-bold rounded-lg flex items-center justify-center transition-all ${isSelected ? 'bg-primary text-white' : isToday ? 'bg-primary/10 text-primary' : 'hover:bg-slate-100 text-slate-600'}`}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-0 lg:gap-8 -mx-2 lg:mx-0">
      {/* Panel lateral desktop */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-fit">
        <div className="p-4 border-b border-slate-100">
          <button
            onClick={() => onCreateClick()}
            className="flex w-full items-center justify-center gap-2 py-3 px-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-sm transition-colors shadow-md"
          >
            <span className="material-symbols-outlined text-lg">add</span> Crear
          </button>
        </div>
        <div className="border-b border-slate-100">{renderMiniCalendar()}</div>
        <div className="p-4 space-y-3">
          <Filters
            variant="sidebar"
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            filterService={filterService}
            onServiceChange={onServiceChange}
            filterStatus={filterStatus}
            onStatusChange={onStatusChange}
            services={services}
          />
        </div>
      </aside>

      {/* Vista principal del calendario */}
      <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Barra móvil: filtros y crear */}
        <div className="lg:hidden">
          <Filters
            variant="mobile"
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            filterService={filterService}
            onServiceChange={onServiceChange}
            filterStatus={filterStatus}
            onStatusChange={onStatusChange}
            services={services}
            calendarViewMode={calendarViewMode}
            onViewModeChange={onViewModeChange}
            onCreateClick={() => onCreateClick()}
          />
        </div>

        {/* Navegación del calendario */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 p-3 sm:p-4 border-b border-slate-100">
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <button onClick={goToToday} className="px-3 sm:px-4 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors min-h-[40px]">
              Hoy
            </button>
            <button onClick={() => goToMonth(-1)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center">
              <span className="material-symbols-outlined text-slate-600">chevron_left</span>
            </button>
            <button onClick={() => goToMonth(1)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center">
              <span className="material-symbols-outlined text-slate-600">chevron_right</span>
            </button>
            <h2 className="text-base sm:text-lg font-black text-slate-800">
              {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
            </h2>
          </div>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              {(['month', 'week', 'list'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => onViewModeChange(m)}
                  className={`px-2 sm:px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-bold transition-all min-h-[36px] ${
                    calendarViewMode === m ? 'bg-white text-primary shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {m === 'month' ? 'Mes' : m === 'week' ? 'Sem.' : 'Lista'}
                </button>
              ))}
            </div>
            <span className="bg-slate-200 text-slate-600 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold">
              {filteredApps.length}
            </span>
          </div>
        </div>

        {loading && (
          <div className="p-8 space-y-4 animate-pulse">
            <div className="grid grid-cols-7 gap-2">
              {Array(35).fill(0).map((_, i) => (
                <div key={i} className="h-20 bg-slate-100 rounded-xl" />
              ))}
            </div>
          </div>
        )}

        {/* Vista Lista */}
        {!loading && calendarViewMode === 'list' && (
          <div className="p-4 overflow-y-auto flex-1 min-h-0">
            {groupedAppointmentsForList.map(([date, apps]) => (
              <div key={date} className="mb-6">
                <div className="flex items-center gap-2 mb-3 sticky top-0 bg-white py-2">
                  <span className="text-sm font-black text-slate-700 uppercase">{labelDate(date)}</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="space-y-2">
                  {apps.map((app) => {
                    const statusBg =
                      app.status === AppointmentStatus.REALIZED
                        ? 'bg-emerald-50 border-l-emerald-500'
                        : app.status === AppointmentStatus.NO_SHOW
                          ? 'bg-rose-50 border-l-rose-500'
                          : 'bg-slate-50 border-l-primary';
                    return (
                      <button
                        key={app.id}
                        onClick={() => onSelectAppointment(app.id || null)}
                        onMouseEnter={() => onHoverAppointment(app.id || null)}
                        onMouseLeave={() => onHoverAppointment(null)}
                        className={`w-full text-left p-4 rounded-xl border-l-4 ${statusBg} transition-all ${
                          selectedId === app.id ? 'ring-2 ring-primary' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-slate-800">{app.patientName}</p>
                            <p className="text-xs text-slate-500">{app.service}</p>
                          </div>
                          <span className="text-sm font-black text-primary">{app.time}</span>
                        </div>
                        {hoveredAppId === app.id && (
                          <div className="mt-2 text-xs text-slate-500 border-t border-slate-200 pt-2">
                            {app.email} · {app.phone}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {groupedAppointmentsForList.length === 0 && (
              <div className="py-12 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-200">event_busy</span>
                <p className="text-slate-400 font-bold mt-2">No hay citas</p>
              </div>
            )}
          </div>
        )}

        {/* Vista Semanal */}
        {!loading && calendarViewMode === 'week' && (
          <div className="p-4 overflow-x-auto">
            <div className="flex gap-2 mb-2">
              <button onClick={() => goToWeek(-1)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button onClick={() => goToWeek(1)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
            <div className="grid grid-cols-7 min-w-[700px] gap-px bg-slate-200">
              {weekCells.map((cell) => {
                const apps = appointmentsByDate[cell.dateStr] || [];
                const isToday = cell.dateStr === todayISO;
                return (
                  <div
                    key={cell.dateStr}
                    className={`bg-white min-h-[200px] p-2 ${isToday ? 'ring-2 ring-primary' : ''}`}
                  >
                    <div
                      className={`text-xs font-bold mb-2 ${
                        isToday ? 'text-primary' : 'text-slate-600'
                      }`}
                    >
                      {weekdayShort[cell.date.getDay() === 0 ? 6 : cell.date.getDay() - 1]} {cell.date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {apps.map((app) => {
                        const statusBg =
                          app.status === AppointmentStatus.REALIZED
                            ? 'bg-emerald-100 border-l-emerald-500'
                            : app.status === AppointmentStatus.NO_SHOW
                              ? 'bg-rose-100 border-l-rose-500'
                              : 'bg-slate-100 border-l-primary';
                        return (
                          <button
                            key={app.id}
                            onClick={() => onSelectAppointment(app.id || null)}
                            className={`w-full text-left px-2 py-1 rounded-r text-[10px] border-l-2 truncate ${statusBg}`}
                          >
                            {app.time} {app.patientName}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => onCreateClick(cell.dateStr)}
                        className="w-full text-left px-2 py-1 text-[10px] text-slate-400 hover:bg-slate-50 rounded flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">add</span> Nueva
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Vista Mes */}
        {!loading && calendarViewMode === 'month' && (
          <div className="p-3 sm:p-4 overflow-x-auto flex-1 min-h-0">
            <div className="min-w-[320px] w-full sm:min-w-[500px] lg:min-w-[600px]">
              <div className="grid grid-cols-7 border-b border-slate-200">
                {weekdayShort.map((day) => (
                  <div
                    key={day}
                    className="py-2 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wide border-r border-slate-100 last:border-r-0"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 border-l border-slate-200">
                {calendarCells.map((cell, idx) => {
                  const apps = appointmentsByDate[cell.dateStr] || [];
                  const isToday = cell.dateStr === todayISO;
                  return (
                    <div
                      key={idx}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('[data-app-id]')) return;
                        onCreateClick(cell.dateStr);
                      }}
                      className={`min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] border-r border-b border-slate-100 p-1 sm:p-1.5 cursor-pointer group ${
                        !cell.isCurrentMonth ? 'bg-slate-50/50' : isToday ? 'bg-primary/5' : 'bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div
                        className={`text-[11px] font-bold mb-1 ${
                          !cell.isCurrentMonth ? 'text-slate-300' : isToday ? 'text-primary' : 'text-slate-600'
                        }`}
                      >
                        {cell.date.getDate()}
                      </div>
                      <div className="space-y-1 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {apps.slice(0, 4).map((app) => {
                          const statusBg =
                            app.status === AppointmentStatus.REALIZED
                              ? 'bg-emerald-100 border-l-emerald-500'
                              : app.status === AppointmentStatus.NO_SHOW
                                ? 'bg-rose-100 border-l-rose-500'
                                : 'bg-slate-100 border-l-primary';
                          return (
                            <div key={app.id} className="relative" data-app-id>
                              <button
                                onClick={() => onSelectAppointment(app.id || null)}
                                onMouseEnter={() => onHoverAppointment(app.id || null)}
                                onMouseLeave={() => onHoverAppointment(null)}
                                className={`w-full text-left px-2 py-1 rounded-r text-[10px] font-medium truncate border-l-2 transition-all hover:opacity-90 ${statusBg} ${
                                  selectedId === app.id ? 'ring-2 ring-primary ring-offset-1' : ''
                                }`}
                                title={`${app.time} - ${app.patientName} - ${app.service}`}
                              >
                                <span className="font-bold text-slate-600">{app.time}</span> {app.patientName}
                              </button>
                              {hoveredAppId === app.id && (
                                <div className="absolute z-30 left-0 top-full mt-1 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-xl max-w-[220px]">
                                  <p className="font-bold">{app.patientName}</p>
                                  <p className="text-white/80">{app.service}</p>
                                  <p>{app.time} · {app.date}</p>
                                  <p className="text-white/70 truncate">{app.email}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {apps.length > 4 && (
                          <div className="text-[9px] font-bold text-slate-400 pl-1">+{apps.length - 4} más</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {filteredApps.length === 0 && !loading && calendarViewMode !== 'list' && (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-slate-200 mb-3">event_busy</span>
            <p className="text-slate-400 font-bold">No hay citas que coincidan con los filtros.</p>
            {onClearFilters && (
              <button onClick={onClearFilters} className="mt-3 text-primary font-bold hover:underline text-sm">
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        <details className="lg:hidden border-t border-slate-100">
          <summary className="text-sm font-bold text-slate-600 cursor-pointer flex items-center gap-2 p-4">
            <span className="material-symbols-outlined text-lg">calendar_month</span> Mini calendario
          </summary>
          <div className="p-3 bg-slate-50">{renderMiniCalendar()}</div>
        </details>
      </div>
    </div>
  );
};

export default AppointmentCalendar;
