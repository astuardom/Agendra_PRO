
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { AppointmentStatus, Appointment } from '../types';
import { subscribeToAppointments, updateAppointmentStatus } from '../services/appointmentService';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  date: string;
  status: 'new' | 'read';
}

const Dashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'appointments' | 'messages'>('appointments');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>(AppointmentStatus.PENDING);
  const [filterDate, setFilterDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [viewDate, setViewDate] = useState(new Date());

  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribeApps = subscribeToAppointments((data) => {
      setAppointments(data);
      setLoading(false);
    });

    const qMessages = query(collection(db, 'messages'), orderBy('date', 'desc'));
    const unsubscribeMsgs = onSnapshot(qMessages, 
      (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ContactMessage[];
        setMessages(msgs);
        setError(null);
      },
      (err) => {
        console.error("Error en listener de mensajes:", err);
        if (err.code === 'permission-denied') {
          setError("No tienes permisos para ver los mensajes.");
        }
      }
    );

    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      unsubscribeApps();
      unsubscribeMsgs();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      navigate('/', { replace: true });
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      await signOut(auth);
      window.location.href = '/';
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este mensaje permanentemente?')) {
      try {
        await deleteDoc(doc(db, 'messages', id));
      } catch (e) {
        console.error("Error deleting message:", e);
      }
    }
  };

  const handleToggleMessageRead = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'new' ? 'read' : 'new';
      await updateDoc(doc(db, 'messages', id), { status: newStatus });
    } catch (e) {
      console.error("Error updating message status:", e);
    }
  };

  const handleReplyMessage = (message: ContactMessage) => {
    const subject = encodeURIComponent("Respuesta a su consulta - MenteSana");
    const body = encodeURIComponent(`Hola ${message.name},\n\nEs un gusto saludarte. Gracias por contactarnos a través de MenteSana. Respecto a tu consulta:\n\n`);
    window.location.href = `mailto:${message.email}?subject=${subject}&body=${body}`;
    
    if (message.status === 'new') {
      handleToggleMessageRead(message.id, 'new');
    }
  };

  const handleWhatsAppReminder = (app: Appointment) => {
    const cleanPhone = app.phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Hola ${app.patientName}, te escribo de MenteSana para recordarte tu sesión de ${app.service} programada para el día ${app.date} a las ${app.time} hrs. ¡Nos vemos pronto!`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const activeApp = useMemo(() => appointments.find((a) => a.id === selectedId) || null, [appointments, selectedId]);

  useEffect(() => {
    setStatusError(null);
    setUpdatingStatus(false);
  }, [selectedId]);

  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const labelDate = (dateISO: string) => {
    if (dateISO === todayISO) return `Hoy · ${dateISO}`;
    if (dateISO === tomorrowISO) return `Mañana · ${dateISO}`;
    return dateISO;
  };

  const stats = useMemo(() => {
    const todayApps = appointments.filter((a) => a.date === todayISO);
    return {
      totalToday: todayApps.length,
      pending: appointments.filter((a) => a.status === AppointmentStatus.PENDING).length,
      newMessages: messages.filter(m => m.status === 'new').length,
      completed: appointments.filter((a) => a.status === AppointmentStatus.REALIZED).length,
    };
  }, [appointments, messages, todayISO]);

  const filteredApps = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return appointments.filter((app) => {
      const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
      const matchesDate = !filterDate || app.date === filterDate;
      const matchesSearch = !term || app.patientName?.toLowerCase().includes(term) || app.email?.toLowerCase().includes(term) || app.phone?.includes(term);
      return matchesStatus && matchesDate && matchesSearch;
    });
  }, [appointments, filterStatus, filterDate, searchTerm]);

  const groupedAppointments = useMemo(() => {
    const groups: Record<string, Appointment[]> = {};
    const sorted = [...filteredApps].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    sorted.forEach((app) => {
      if (!groups[app.date]) groups[app.date] = [];
      groups[app.date].push(app);
    });
    return Object.entries(groups).sort(([d1], [d2]) => d1.localeCompare(d2));
  }, [filteredApps]);

  const handleUpdateStatus = async (id: string, newStatus: AppointmentStatus) => {
    if (activeApp?.status === newStatus) return;
    
    setUpdatingStatus(true);
    setStatusError(null);

    try {
      await updateAppointmentStatus(id, newStatus);
    } catch (err: any) {
      console.error("Error al actualizar estado:", err);
      setStatusError('Error al sincronizar con el servidor. Intente de nuevo.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const renderMiniCalendar = () => {
    const month = viewDate.getMonth();
    const year = viewDate.getFullYear();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    return (
      <div className="p-4 w-64 bg-white">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => setViewDate(new Date(year, month - 1))} className="p-1 hover:bg-slate-100 rounded">
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <span className="text-xs font-black text-slate-700 uppercase">{monthNames[month]} {year}</span>
          <button onClick={() => setViewDate(new Date(year, month + 1))} className="p-1 hover:bg-slate-100 rounded">
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, idx) => {
            if (!date) return <div key={idx} />;
            const dateStr = date.toISOString().split('T')[0];
            const isSelected = filterDate === dateStr;
            return (
              <button
                key={idx}
                onClick={() => { setFilterDate(dateStr); setShowDatePicker(false); }}
                className={`aspect-square text-[10px] font-bold rounded-lg flex items-center justify-center transition-all ${isSelected ? 'bg-primary text-white' : 'hover:bg-blue-50 text-slate-600'}`}
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
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden text-text-main font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0">
        <div className="p-8 border-b border-slate-100 flex items-center gap-3">
          <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
            <span className="material-symbols-outlined text-2xl">calendar_month</span>
          </div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Agenda Pro</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('appointments')}
            className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'appointments' ? 'text-primary bg-blue-50' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <span className="material-symbols-outlined">dashboard</span> Gestión de Citas
          </button>
          <button 
            onClick={() => setActiveTab('messages')}
            className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'messages' ? 'text-primary bg-blue-50' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <span className="material-symbols-outlined">mail</span> Mensajes Web
            {stats.newMessages > 0 && <span className="ml-auto bg-primary text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm animate-pulse">{stats.newMessages}</span>}
          </button>
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 font-bold transition-all">
            <span className="material-symbols-outlined">logout</span> Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {error && (
          <div className="bg-rose-600 text-white px-6 py-2 text-center text-xs font-bold animate-pulse">
            {error}
          </div>
        )}
        <div className="p-6 lg:p-10 bg-[#f8fafc] overflow-y-auto flex-1">
          <div className="max-w-[1400px] mx-auto space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'CITAS HOY', value: stats.totalToday, icon: 'calendar_today', color: 'bg-primary' },
                { label: 'PENDIENTES', value: stats.pending, icon: 'assignment_late', color: 'bg-amber-500' },
                { label: 'MENSAJES NUEVOS', value: stats.newMessages, icon: 'mail', color: 'bg-blue-500' },
                { label: 'REALIZADAS', value: stats.completed, icon: 'check_circle', color: 'bg-emerald-500' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
                  <div className={`size-14 rounded-2xl ${stat.color} text-white flex items-center justify-center shadow-lg`}><span className="material-symbols-outlined text-3xl">{stat.icon}</span></div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-3xl font-black text-slate-800 leading-none">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {activeTab === 'appointments' ? (
              <>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mt-12">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black text-slate-800">Agenda de Citas</h2>
                    <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{filteredApps.length}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                      {['all', AppointmentStatus.PENDING, AppointmentStatus.REALIZED, AppointmentStatus.NO_SHOW].map((st) => (
                        <button key={st} onClick={() => setFilterStatus(st)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === st ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50'}`}>{st === 'all' ? 'Todas' : st.toUpperCase()}</button>
                      ))}
                    </div>
                    <div className="relative" ref={datePickerRef}>
                      <button onClick={() => setShowDatePicker(!showDatePicker)} className="h-10 px-4 bg-white border border-slate-200 rounded-xl flex items-center gap-2 text-xs font-bold text-slate-600">
                        <span className="material-symbols-outlined text-sm">calendar_month</span> {filterDate || 'Filtrar Fecha'}
                      </button>
                      {showDatePicker && <div className="absolute top-12 left-0 z-[60] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">{renderMiniCalendar()}</div>}
                    </div>
                  </div>
                </div>

                <div className="space-y-12">
                  {groupedAppointments.map(([date, apps]) => (
                    <div key={date} className="space-y-6">
                      <div className="flex items-center gap-4 sticky top-0 bg-[#f8fafc] z-20 py-2">
                        <div className="flex items-center gap-2 bg-white px-6 py-2 rounded-full border border-slate-200 shadow-sm">
                          <span className="text-sm font-black text-slate-700 uppercase tracking-widest">{labelDate(date)}</span>
                        </div>
                        <div className="h-px flex-1 bg-slate-200"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {apps.map((app) => (
                          <div key={app.id} onClick={() => setSelectedId(app.id || null)} className={`p-6 rounded-[2rem] border transition-all cursor-pointer shadow-sm hover:shadow-xl ${selectedId === app.id ? 'ring-2 ring-primary bg-white' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                            <div className="flex justify-between items-start mb-6">
                              <div className="size-10 rounded-xl bg-white border flex items-center justify-center text-slate-400"><span className="material-symbols-outlined">person</span></div>
                              <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${app.status === AppointmentStatus.REALIZED ? 'bg-emerald-600 text-white' : app.status === AppointmentStatus.NO_SHOW ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'}`}>{app.status}</span>
                            </div>
                            <h3 className="font-black text-slate-800 text-lg mb-1">{app.patientName}</h3>
                            <p className="text-xs text-slate-500 font-bold mb-6">{app.service}</p>
                            <div className="flex items-center justify-between border-t border-slate-200/60 pt-4">
                              <span className="text-xs font-bold text-slate-600">{app.phone}</span>
                              <span className="text-sm font-black text-primary bg-white border border-blue-100 px-3 py-1 rounded-xl">{app.time} hrs</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {groupedAppointments.length === 0 && !loading && (
                    <div className="py-20 text-center bg-white rounded-[3rem] border border-slate-200 border-dashed">
                      <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">event_busy</span>
                      <p className="text-slate-400 font-bold text-lg">No hay citas que coincidan con los filtros.</p>
                      <button onClick={() => { setFilterStatus('all'); setFilterDate(''); setSearchTerm(''); }} className="mt-4 text-primary font-bold hover:underline">Limpiar filtros</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-2xl font-black text-slate-800">Buzón de Consultas</h2>
                  <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{messages.length}</span>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`group bg-white p-8 rounded-3xl border transition-all shadow-sm flex flex-col md:flex-row justify-between gap-6 relative overflow-hidden ${msg.status === 'new' ? 'border-primary/20 bg-gradient-to-br from-white to-indigo-50/20' : 'border-slate-100'}`}>
                      {msg.status === 'new' && <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>}
                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className={`size-12 rounded-2xl flex items-center justify-center ${msg.status === 'new' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 text-slate-400'}`}>
                            <span className="material-symbols-outlined">{msg.status === 'new' ? 'mark_as_unread' : 'drafts'}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-0.5">
                              <h4 className="font-black text-slate-800 text-lg">{msg.name}</h4>
                              {msg.status === 'new' && <span className="bg-primary text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Nuevo</span>}
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-tight">
                              <span className="material-symbols-outlined text-sm">mail</span> {msg.email}
                              <span className="text-slate-200 mx-1">|</span>
                              <span className="material-symbols-outlined text-sm">schedule</span> {new Date(msg.date).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="bg-white/60 p-5 rounded-2xl border border-slate-100 text-sm leading-relaxed text-slate-700 italic">
                          "{msg.message}"
                        </div>
                      </div>
                      <div className="flex md:flex-col items-center justify-end gap-3 shrink-0">
                        <button 
                          onClick={() => handleReplyMessage(msg)}
                          className="flex-1 md:w-full px-5 py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg shadow-slate-200"
                        >
                          <span className="material-symbols-outlined text-sm">reply</span> Responder
                        </button>
                        <div className="flex gap-2 w-full md:w-auto">
                          <button 
                            onClick={() => handleToggleMessageRead(msg.id, msg.status)}
                            title={msg.status === 'new' ? "Marcar como leído" : "Marcar como no leído"}
                            className={`flex-1 size-11 rounded-2xl flex items-center justify-center border-2 transition-all ${msg.status === 'new' ? 'border-slate-100 bg-white text-slate-400 hover:text-primary hover:border-primary/20' : 'border-primary/10 bg-indigo-50 text-primary'}`}
                          >
                            <span className="material-symbols-outlined text-xl">{msg.status === 'new' ? 'check' : 'visibility_off'}</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteMessage(msg.id)}
                            title="Eliminar mensaje"
                            className="flex-1 size-11 rounded-2xl border-2 border-slate-100 bg-white text-rose-400 flex items-center justify-center hover:bg-rose-50 hover:border-rose-100 transition-all"
                          >
                            <span className="material-symbols-outlined text-xl">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {messages.length === 0 && !error && (
                    <div className="py-24 text-center bg-white rounded-[3rem] border border-slate-200 border-dashed">
                      <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-4xl text-slate-200">mail_outline</span>
                      </div>
                      <p className="text-slate-400 font-bold text-lg">No hay mensajes recibidos aún.</p>
                      <p className="text-slate-300 text-sm">Las consultas de tus pacientes aparecerán aquí.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal de Detalle de Cita */}
        {activeApp && selectedId === activeApp.id && (
          <>
            <div onClick={() => setSelectedId(null)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"></div>
            <aside className="fixed top-0 right-0 h-full w-full lg:w-[500px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-800">Detalles de Cita</h2>
                <button onClick={() => setSelectedId(null)} className="size-10 flex items-center justify-center text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"><span className="material-symbols-outlined">close</span></button>
              </div>
              <div className="p-8 flex-1 space-y-8 overflow-y-auto">
                {/* Cabecera del Detalle con Transición de Color */}
                <div className={`p-8 rounded-[2.5rem] text-white shadow-xl transition-all duration-500 transform scale-[1.01] ${activeApp.status === AppointmentStatus.REALIZED ? 'bg-emerald-600' : activeApp.status === AppointmentStatus.NO_SHOW ? 'bg-rose-600' : 'bg-slate-900'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="animate-fade-in">
                      <h3 className="text-3xl font-black mb-1">{activeApp.patientName}</h3>
                      <p className="text-white/70 text-sm font-bold italic">{activeApp.service}</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl text-center border border-white/10">
                       <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Hora</p>
                       <p className="text-lg font-black">{activeApp.time}</p>
                    </div>
                  </div>
                  <div className="space-y-4 animate-fade-in-delayed">
                    <div className="flex items-center gap-3"><span className="material-symbols-outlined text-white/60">mail</span><span className="text-sm font-medium">{activeApp.email}</span></div>
                    <div className="flex items-center gap-3"><span className="material-symbols-outlined text-white/60">call</span><span className="text-sm font-medium">{activeApp.phone}</span></div>
                    <div className="flex items-center gap-3"><span className="material-symbols-outlined text-white/60">calendar_today</span><span className="text-sm font-medium">{activeApp.date}</span></div>
                  </div>

                  {/* Botón de Recordatorio WhatsApp */}
                  <button 
                    onClick={() => handleWhatsAppReminder(activeApp)}
                    className="mt-6 w-full py-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.438 9.889-9.886.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.894 4.445-9.897 9.896-.001 2.155.593 3.584 1.589 5.158l-.903 3.305 3.411-.893zm11.105-7.077c-.305-.152-1.805-.891-2.084-.993-.279-.103-.482-.152-.684.152-.202.304-.785 1.015-.962 1.218-.177.203-.355.228-.659.076-.304-.152-1.285-.473-2.449-1.511-.905-.807-1.515-1.804-1.692-2.108-.177-.304-.019-.468.133-.619.136-.136.304-.355.456-.532.152-.177.202-.304.304-.507.102-.203.051-.38-.025-.532-.076-.152-.684-1.648-.938-2.256-.247-.594-.499-.513-.684-.523-.177-.01-.38-.011-.583-.011-.203 0-.532.076-.811.38-.279.304-1.065 1.041-1.065 2.538 0 1.497 1.09 2.943 1.242 3.146.152.203 2.144 3.273 5.193 4.591.725.313 1.291.5 1.731.639.728.231 1.39.198 1.914.12.584-.087 1.805-.736 2.058-1.445.253-.708.253-1.317.177-1.445-.076-.127-.279-.203-.584-.355z"/></svg>
                    Enviar Recordatorio WhatsApp
                  </button>
                </div>

                {/* Sección de Gestión de Estados */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center px-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cambiar Estado de Cita</p>
                    {updatingStatus && (
                      <span className="flex items-center gap-2 text-primary text-[10px] font-black animate-pulse">
                        <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span> SINCRONIZANDO
                      </span>
                    )}
                  </div>

                  {statusError && (
                    <div className="mx-2 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-xs font-bold animate-fade-in">
                      <span className="material-symbols-outlined text-lg">warning</span>
                      <p>{statusError}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    {/* Botón Pendiente */}
                    <button 
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus(activeApp.id!, AppointmentStatus.PENDING)} 
                      className={`group w-full p-6 rounded-3xl border-2 transition-all text-left font-black flex items-center gap-5 ${
                        activeApp.status === AppointmentStatus.PENDING 
                        ? 'border-slate-800 bg-slate-900 text-white shadow-lg' 
                        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className={`size-12 rounded-2xl flex items-center justify-center transition-colors ${activeApp.status === AppointmentStatus.PENDING ? 'bg-white/10' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                        <span className="material-symbols-outlined">hourglass_empty</span> 
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">Pendiente</p>
                        <p className={`text-[10px] font-bold ${activeApp.status === AppointmentStatus.PENDING ? 'text-white/60' : 'text-slate-400'}`}>Cita agendada, esperando ejecución.</p>
                      </div>
                      {activeApp.status === AppointmentStatus.PENDING && <span className="material-symbols-outlined animate-scale-in text-white">check_circle</span>}
                    </button>

                    {/* Botón Realizada */}
                    <button 
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus(activeApp.id!, AppointmentStatus.REALIZED)} 
                      className={`group w-full p-6 rounded-3xl border-2 transition-all text-left font-black flex items-center gap-5 ${
                        activeApp.status === AppointmentStatus.REALIZED 
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-100' 
                        : 'border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 text-slate-700'
                      }`}
                    >
                      <div className={`size-12 rounded-2xl flex items-center justify-center transition-colors ${activeApp.status === AppointmentStatus.REALIZED ? 'bg-white/10' : 'bg-emerald-50 group-hover:bg-emerald-100'}`}>
                        <span className="material-symbols-outlined">task_alt</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">Realizada</p>
                        <p className={`text-[10px] font-bold ${activeApp.status === AppointmentStatus.REALIZED ? 'text-white/60' : 'text-slate-400'}`}>Sesión terapéutica completada con éxito.</p>
                      </div>
                      {activeApp.status === AppointmentStatus.REALIZED && <span className="material-symbols-outlined animate-scale-in text-white">check_circle</span>}
                    </button>

                    {/* Botón Inasistencia */}
                    <button 
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus(activeApp.id!, AppointmentStatus.NO_SHOW)} 
                      className={`group w-full p-6 rounded-3xl border-2 transition-all text-left font-black flex items-center gap-5 ${
                        activeApp.status === AppointmentStatus.NO_SHOW 
                        ? 'border-rose-600 bg-rose-600 text-white shadow-lg shadow-rose-100' 
                        : 'border-slate-100 hover:border-rose-200 hover:bg-rose-50 text-slate-700'
                      }`}
                    >
                      <div className={`size-12 rounded-2xl flex items-center justify-center transition-colors ${activeApp.status === AppointmentStatus.NO_SHOW ? 'bg-white/10' : 'bg-rose-50 group-hover:bg-rose-100'}`}>
                        <span className="material-symbols-outlined">person_off</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">No Asistió</p>
                        <p className={`text-[10px] font-bold ${activeApp.status === AppointmentStatus.NO_SHOW ? 'text-white/60' : 'text-slate-400'}`}>El paciente no se presentó al encuentro.</p>
                      </div>
                      {activeApp.status === AppointmentStatus.NO_SHOW && <span className="material-symbols-outlined animate-scale-in text-white">check_circle</span>}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                <p className="text-[10px] text-slate-400 font-bold mb-4 uppercase tracking-widest">Información de Sincronización</p>
                <div className="p-4 bg-white border border-slate-200 rounded-2xl text-[10px] text-slate-500 leading-relaxed italic shadow-sm">
                  * El cambio de estado se registra de forma inmediata. No es necesario guardar cambios adicionales.
                </div>
              </div>
            </aside>
          </>
        )}
      </main>

      <style>{`
        @keyframes slide-in-right { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes fade-in { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scale-in { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
        .animate-slide-in-right { animation: slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animate-fade-in-delayed { animation: fade-in 0.3s ease-out 0.15s both; }
        .animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>
    </div>
  );
};

export default Dashboard;
