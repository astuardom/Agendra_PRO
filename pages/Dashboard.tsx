
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { AppointmentStatus, Appointment, Patient } from '../types';
import { subscribeToAppointments, updateAppointmentStatus, createAppointment, updateAppointment } from '../services/appointmentService';
import { subscribeToPatients, createPatient, updatePatient, deletePatient } from '../services/patientService';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { SERVICES, FIXED_TIMES, DASHBOARD_STORAGE_KEY } from '../constants';

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
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activeTab, setActiveTab] = useState<'appointments' | 'messages' | 'patients'>('appointments');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const loadStored = () => {
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches;
    const defaultView = isMobile ? 'list' : 'month';
    try {
      const raw = localStorage.getItem(DASHBOARD_STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        return {
          filterStatus: data.filterStatus ?? 'all',
          searchTerm: data.searchTerm ?? '',
          filterService: data.filterService ?? '',
          calendarViewMode: data.calendarViewMode ?? defaultView,
        };
      }
    } catch (_) {}
    return { filterStatus: 'all', searchTerm: '', filterService: '', calendarViewMode: defaultView };
  };

  const stored = loadStored();
  const [filterStatus, setFilterStatus] = useState<string>(stored.filterStatus);
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState<string>(stored.searchTerm);
  const [filterService, setFilterService] = useState<string>(stored.filterService);
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'week' | 'list'>(stored.calendarViewMode);

  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const [hoveredAppId, setHoveredAppId] = useState<string | null>(null);
  const [confirmStatusChange, setConfirmStatusChange] = useState<{ id: string; status: AppointmentStatus } | null>(null);
  const [appointmentFormModal, setAppointmentFormModal] = useState<'create' | 'edit' | null>(null);
  const [formPrefillDate, setFormPrefillDate] = useState<string | null>(null);
  const [formData, setFormData] = useState({ patientName: '', phone: '', email: '', service: SERVICES[0], date: '', time: FIXED_TIMES[1], notes: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [patientFormModal, setPatientFormModal] = useState<'create' | 'edit' | null>(null);
  const [patientFormData, setPatientFormData] = useState({ name: '', email: '', phone: '', birthDate: '', notes: '' });
  const [patientFormErrors, setPatientFormErrors] = useState<Record<string, string>>({});
  const [patientFormSubmitting, setPatientFormSubmitting] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify({
      filterStatus, searchTerm, filterService, calendarViewMode
    }));
  }, [filterStatus, searchTerm, filterService, calendarViewMode]);

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

    const unsubscribePatients = subscribeToPatients((data) => {
      setPatients(data);
      setPatientsLoading(false);
    });

    return () => {
      unsubscribeApps();
      unsubscribeMsgs();
      unsubscribePatients();
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
      const matchesSearch = !term || app.patientName?.toLowerCase().includes(term) || app.email?.toLowerCase().includes(term) || app.phone?.includes(term) || app.service?.toLowerCase().includes(term);
      const matchesService = !filterService || app.service === filterService;
      return matchesStatus && matchesSearch && matchesService;
    });
  }, [appointments, filterStatus, searchTerm, filterService]);

  const handleUpdateStatus = async (id: string, newStatus: AppointmentStatus, skipConfirm = false) => {
    if (activeApp?.status === newStatus) return;
    const needsConfirm = (newStatus === AppointmentStatus.REALIZED || newStatus === AppointmentStatus.NO_SHOW) && !skipConfirm;
    if (needsConfirm) {
      setConfirmStatusChange({ id, status: newStatus });
      return;
    }
    setUpdatingStatus(true);
    setStatusError(null);
    try {
      await updateAppointmentStatus(id, newStatus);
      setConfirmStatusChange(null);
    } catch (err: any) {
      console.error("Error al actualizar estado:", err);
      setStatusError('Error al sincronizar con el servidor. Intente de nuevo.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const confirmStatusAndApply = () => {
    if (confirmStatusChange) {
      handleUpdateStatus(confirmStatusChange.id, confirmStatusChange.status, true);
    }
    setConfirmStatusChange(null);
  };

  const validateForm = () => {
    const err: Record<string, string> = {};
    if (!formData.patientName.trim()) err.patientName = 'El nombre es obligatorio.';
    else if (formData.patientName.trim().length < 3) err.patientName = 'Al menos 3 caracteres.';
    if (!formData.email.trim()) err.email = 'El correo es obligatorio.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) err.email = 'Correo inválido.';
    if (!formData.phone.trim()) err.phone = 'El teléfono es obligatorio.';
    else if (formData.phone.replace(/\D/g, '').length < 8) err.phone = 'Al menos 8 dígitos.';
    if (!formData.service) err.service = 'Selecciona un servicio.';
    if (!formData.date) err.date = 'Selecciona una fecha.';
    if (!formData.time) err.time = 'Selecciona una hora.';
    setFormErrors(err);
    return Object.keys(err).length === 0;
  };

  const openCreateModal = (dateStr?: string) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    d.setDate(d.getDate() + (dateStr ? 0 : 1));
    const date = d.toISOString().split('T')[0];
    setFormData({ patientName: '', phone: '', email: '', service: SERVICES[0], date, time: FIXED_TIMES[1], notes: '' });
    setFormErrors({});
    setFormPrefillDate(dateStr || null);
    setAppointmentFormModal('create');
  };

  const openEditModal = (app: Appointment) => {
    setFormData({
      patientName: app.patientName,
      phone: app.phone,
      email: app.email,
      service: app.service,
      date: app.date,
      time: app.time,
      notes: app.notes || '',
    });
    setFormErrors({});
    setFormPrefillDate(null);
    setAppointmentFormModal('edit');
    setSelectedId(app.id || null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setFormSubmitting(true);
    try {
      if (appointmentFormModal === 'create') {
        await createAppointment({
          patientName: formData.patientName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          service: formData.service,
          date: formData.date,
          time: formData.time,
          notes: formData.notes.trim() || undefined,
        });
        setAppointmentFormModal(null);
      } else if (appointmentFormModal === 'edit' && activeApp?.id) {
        await updateAppointment(activeApp.id, {
          patientName: formData.patientName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          service: formData.service,
          date: formData.date,
          time: formData.time,
          notes: formData.notes.trim() || undefined,
        });
        setAppointmentFormModal(null);
      }
    } catch (err) {
      setFormErrors({ submit: 'Error al guardar. Intenta de nuevo.' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const validatePatientForm = () => {
    const err: Record<string, string> = {};
    if (!patientFormData.name.trim()) err.name = 'El nombre es obligatorio.';
    else if (patientFormData.name.trim().length < 2) err.name = 'Al menos 2 caracteres.';
    if (!patientFormData.email.trim()) err.email = 'El correo es obligatorio.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientFormData.email)) err.email = 'Correo inválido.';
    if (!patientFormData.phone.trim()) err.phone = 'El teléfono es obligatorio.';
    else if (patientFormData.phone.replace(/\D/g, '').length < 8) err.phone = 'Al menos 8 dígitos.';
    setPatientFormErrors(err);
    return Object.keys(err).length === 0;
  };

  const openPatientCreate = () => {
    setPatientFormData({ name: '', email: '', phone: '', birthDate: '', notes: '' });
    setPatientFormErrors({});
    setEditingPatientId(null);
    setPatientFormModal('create');
  };

  const openPatientEdit = (p: Patient) => {
    setPatientFormData({
      name: p.name,
      email: p.email,
      phone: p.phone,
      birthDate: p.birthDate || '',
      notes: p.notes || '',
    });
    setPatientFormErrors({});
    setEditingPatientId(p.id || null);
    setPatientFormModal('edit');
  };

  const handlePatientFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePatientForm()) return;
    setPatientFormSubmitting(true);
    try {
      if (patientFormModal === 'create') {
        await createPatient({
          name: patientFormData.name.trim(),
          email: patientFormData.email.trim(),
          phone: patientFormData.phone.trim(),
          birthDate: patientFormData.birthDate.trim() || undefined,
          notes: patientFormData.notes.trim() || undefined,
        });
        setPatientFormModal(null);
      } else if (patientFormModal === 'edit' && editingPatientId) {
        await updatePatient(editingPatientId, {
          name: patientFormData.name.trim(),
          email: patientFormData.email.trim(),
          phone: patientFormData.phone.trim(),
          birthDate: patientFormData.birthDate.trim() || undefined,
          notes: patientFormData.notes.trim() || undefined,
        });
        setPatientFormModal(null);
      }
    } catch (err) {
      setPatientFormErrors({ submit: 'Error al guardar. Intenta de nuevo.' });
    } finally {
      setPatientFormSubmitting(false);
    }
  };

  const handleDeletePatient = async (id: string) => {
    if (!window.confirm('¿Eliminar este paciente del registro?')) return;
    try {
      await deletePatient(id);
    } catch (e) {
      console.error('Error eliminando paciente:', e);
    }
  };

  const [addingToPatients, setAddingToPatients] = useState(false);
  const [addToPatientsFeedback, setAddToPatientsFeedback] = useState<'ok' | 'exists' | null>(null);

  const handleAddAppointmentToPatients = async (app: Appointment) => {
    const exists = patients.some((p) => p.email.toLowerCase() === app.email.toLowerCase());
    if (exists) {
      setAddToPatientsFeedback('exists');
      setTimeout(() => setAddToPatientsFeedback(null), 3000);
      return;
    }
    setAddingToPatients(true);
    setAddToPatientsFeedback(null);
    try {
      await createPatient({
        name: app.patientName,
        email: app.email,
        phone: app.phone,
        notes: app.service ? `Cita: ${app.service} (${app.date})` : undefined,
      });
      setAddToPatientsFeedback('ok');
      setTimeout(() => setAddToPatientsFeedback(null), 3000);
    } catch (e) {
      console.error('Error añadiendo paciente:', e);
      setAddToPatientsFeedback(null);
    } finally {
      setAddingToPatients(false);
    }
  };

  const [importingFromCalendar, setImportingFromCalendar] = useState(false);
  const [importResult, setImportResult] = useState<{ added: number; skipped: number } | null>(null);

  const handleImportPatientsFromCalendar = async () => {
    const patientEmails = new Set(patients.map((p) => p.email.toLowerCase()));
    const toAdd: Appointment[] = [];
    const seen = new Set<string>();
    appointments.forEach((app) => {
      const email = app.email?.toLowerCase();
      if (email && !patientEmails.has(email) && !seen.has(email)) {
        seen.add(email);
        toAdd.push(app);
      }
    });
    if (toAdd.length === 0) {
      setImportResult({ added: 0, skipped: appointments.length });
      setTimeout(() => setImportResult(null), 4000);
      return;
    }
    setImportingFromCalendar(true);
    setImportResult(null);
    let added = 0;
    try {
      for (const app of toAdd) {
        await createPatient({
          name: app.patientName,
          email: app.email,
          phone: app.phone,
          notes: app.service ? `Cita: ${app.service} (${app.date})` : undefined,
        });
        added++;
      }
      setImportResult({ added, skipped: appointments.length - toAdd.length });
      setTimeout(() => setImportResult(null), 4000);
    } catch (e) {
      console.error('Error importando pacientes:', e);
    } finally {
      setImportingFromCalendar(false);
    }
  };

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const weekdayShort = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

  // Calcular celdas del calendario mensual (tipo Google Calendar, Lunes primero)
  const calendarCells = useMemo(() => {
    const month = viewDate.getMonth();
    const year = viewDate.getFullYear();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    // Ajustar para Lunes = 0 (getDay: 0=Dom, 1=Lun... → restar 1, Dom=-1 → 6)
    const startOffset = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();
    const cells: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];
    // Días del mes anterior
    for (let i = 0; i < startOffset; i++) {
      const d = new Date(year, month, -startOffset + i + 1);
      cells.push({ date: d, dateStr: d.toISOString().split('T')[0], isCurrentMonth: false });
    }
    // Días del mes actual
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, month, d);
      cells.push({ date, dateStr: date.toISOString().split('T')[0], isCurrentMonth: true });
    }
    // Completar hasta múltiplo de 7
    const remainder = cells.length % 7;
    if (remainder > 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        const d = new Date(year, month + 1, i + 1);
        cells.push({ date: d, dateStr: d.toISOString().split('T')[0], isCurrentMonth: false });
      }
    }
    return cells;
  }, [viewDate]);

  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    filteredApps.forEach((app) => {
      if (!map[app.date]) map[app.date] = [];
      map[app.date].push(app);
    });
    Object.keys(map).forEach((d) => map[d].sort((a, b) => a.time.localeCompare(b.time)));
    return map;
  }, [filteredApps]);

  const weekCells = useMemo(() => {
    const monday = new Date(viewDate);
    const d = monday.getDay();
    const diff = d === 0 ? -6 : 1 - d;
    monday.setDate(monday.getDate() + diff);
    const cells: { date: Date; dateStr: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      cells.push({ date: d, dateStr: d.toISOString().split('T')[0] });
    }
    return cells;
  }, [viewDate]);

  const groupedAppointmentsForList = useMemo(() => {
    const groups: Record<string, Appointment[]> = {};
    const sorted = [...filteredApps].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    sorted.forEach((app) => {
      if (!groups[app.date]) groups[app.date] = [];
      groups[app.date].push(app);
    });
    return Object.entries(groups).sort(([d1], [d2]) => d1.localeCompare(d2));
  }, [filteredApps]);

  const goToToday = () => {
    const today = new Date();
    setViewDate(today);
    setFilterDate(today.toISOString().split('T')[0]);
  };

  const goToMonth = (offset: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth() + offset);
    setViewDate(d);
  };

  const goToWeek = (offset: number) => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() + offset * 7);
    setViewDate(d);
  };

  const setViewMode = (mode: 'month' | 'week' | 'list') => {
    setCalendarViewMode(mode);
  };

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
                onClick={() => { setFilterDate(dateStr); setViewDate(new Date(date)); }}
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
    <div className="flex flex-col lg:flex-row h-screen bg-[#f8fafc] overflow-hidden text-text-main font-sans">
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
            onClick={() => setActiveTab('patients')}
            className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'patients' ? 'text-primary bg-blue-50' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <span className="material-symbols-outlined">person</span> Pacientes
            {patients.length > 0 && <span className="ml-auto bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">{patients.length}</span>}
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

      {/* Navegación móvil - ícono hamburguesa en la parte superior */}
      <div className="lg:hidden flex items-center px-2 py-2 bg-white border-b border-slate-200 shrink-0 min-h-[44px] w-full">
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="flex items-center justify-center w-10 h-10 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors" aria-label="Menú">
          <span className="material-symbols-outlined text-2xl">{mobileMenuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Menú móvil deslizable (drawer) */}
      <div onClick={() => setMobileMenuOpen(false)} className={`lg:hidden fixed inset-0 bg-slate-900/40 z-40 transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} aria-hidden={!mobileMenuOpen} />
      <nav aria-hidden={!mobileMenuOpen} className={`lg:hidden fixed top-0 left-0 h-full w-[260px] max-w-[85vw] bg-white shadow-2xl z-50 flex flex-col pt-[60px] transition-transform duration-300 ease-out overflow-hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col p-4 gap-1 overflow-y-auto">
          <button onClick={() => { setActiveTab('appointments'); setMobileMenuOpen(false); }} className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${activeTab === 'appointments' ? 'text-primary bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}>
            <span className="material-symbols-outlined">{activeTab === 'appointments' ? 'event' : 'event_note'}</span>
            Citas
          </button>
          <button onClick={() => { setActiveTab('patients'); setMobileMenuOpen(false); }} className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${activeTab === 'patients' ? 'text-primary bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}>
            <span className="material-symbols-outlined">{activeTab === 'patients' ? 'person' : 'person_outline'}</span>
            Pacientes
            {patients.length > 0 && <span className="ml-auto bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">{patients.length}</span>}
          </button>
          <button onClick={() => { setActiveTab('messages'); setMobileMenuOpen(false); }} className={`flex w-full items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left relative ${activeTab === 'messages' ? 'text-primary bg-blue-50' : 'text-slate-600 hover:bg-slate-50'}`}>
            <span className="material-symbols-outlined">{activeTab === 'messages' ? 'mail' : 'mail_outline'}</span>
            Mensajes Web
            {stats.newMessages > 0 && <span className="ml-auto bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">{stats.newMessages}</span>}
          </button>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="flex w-full items-center gap-2 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 font-bold transition-all">
              <span className="material-symbols-outlined">logout</span>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {error && (
          <div className="bg-rose-600 text-white px-6 py-2 text-center text-xs font-bold animate-pulse">
            {error}
          </div>
        )}
        <div className="p-4 sm:p-6 lg:p-10 bg-[#f8fafc] overflow-y-auto flex-1 overflow-x-hidden">
          <div className="max-w-[1400px] mx-auto space-y-6 sm:space-y-8">
            {/* Stats Cards - en móvil 2x2 para ver las 4 */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 lg:gap-4">
              {[
                { label: 'CITAS HOY', value: stats.totalToday, icon: 'calendar_today', color: 'bg-primary' },
                { label: 'PENDIENTES', value: stats.pending, icon: 'assignment_late', color: 'bg-amber-500' },
                { label: 'MENSAJES', value: stats.newMessages, icon: 'mail', color: 'bg-blue-500' },
                { label: 'REALIZADAS', value: stats.completed, icon: 'check_circle', color: 'bg-emerald-500' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-3 sm:p-6 rounded-xl sm:rounded-3xl border border-slate-200 shadow-sm flex items-center gap-2 sm:gap-5">
                  <div className={`size-9 sm:size-14 rounded-lg sm:rounded-2xl ${stat.color} text-white flex items-center justify-center shadow-lg shrink-0`}><span className="material-symbols-outlined text-xl sm:text-3xl">{stat.icon}</span></div>
                  <div className="min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">{stat.label}</p>
                    <p className="text-lg sm:text-3xl font-black text-slate-800 leading-none">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {activeTab === 'appointments' ? (
              <div className="flex flex-col lg:flex-row gap-0 lg:gap-8 -mx-2 lg:mx-0">
                {/* Panel lateral tipo Google Calendar */}
                <aside className="hidden lg:block w-64 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-fit">
                  <div className="p-4 border-b border-slate-100">
                    <button onClick={() => openCreateModal()} className="flex w-full items-center justify-center gap-2 py-3 px-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-sm transition-colors shadow-md">
                      <span className="material-symbols-outlined text-lg">add</span> Crear
                    </button>
                  </div>
                  <div className="border-b border-slate-100">
                    {renderMiniCalendar()}
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">person_search</span>
                      <input
                        type="text"
                        placeholder="Buscar paciente, email, tel..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Servicio</p>
                      <select value={filterService} onChange={(e) => setFilterService(e.target.value)} className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs font-bold text-slate-700">
                        <option value="">Todos</option>
                        {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="p-4 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Estado</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['all', AppointmentStatus.PENDING, AppointmentStatus.REALIZED, AppointmentStatus.NO_SHOW].map((st) => (
                        <button key={st} onClick={() => setFilterStatus(st)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${filterStatus === st ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{st === 'all' ? 'Todas' : st === 'pendiente' ? 'Pend.' : st === 'realizado' ? 'Realiz.' : 'No asist.'}</button>
                      ))}
                    </div>
                  </div>
                </aside>

                {/* Vista de calendario mensual principal */}
                <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                  {/* Barra móvil: búsqueda, filtros y crear - ARRIBA en móvil */}
                  <div className="lg:hidden flex flex-col gap-3 p-4 border-b border-slate-100 bg-slate-50/50">
                    <button onClick={() => openCreateModal()} className="flex w-full items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-bold text-sm">
                      <span className="material-symbols-outlined">add</span> Crear cita
                    </button>
                    <input type="text" placeholder="Buscar paciente, email, servicio..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm" />
                    <select value={filterService} onChange={(e) => setFilterService(e.target.value)} className="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm">
                      <option value="">Todos los servicios</option>
                      {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {['all', AppointmentStatus.PENDING, AppointmentStatus.REALIZED, AppointmentStatus.NO_SHOW].map((st) => (
                        <button key={st} onClick={() => setFilterStatus(st)} className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold ${filterStatus === st ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{st === 'all' ? 'Todas' : st === 'pendiente' ? 'Pend.' : st === 'realizado' ? 'Realiz.' : 'No asist.'}</button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {(['list', 'month'] as const).map((m) => (
                        <button key={m} onClick={() => setViewMode(m)} className={`flex-1 py-2 rounded-xl text-xs font-bold ${calendarViewMode === m ? 'bg-primary text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{m === 'list' ? 'Lista' : 'Calendario'}</button>
                      ))}
                    </div>
                  </div>
                  {/* Barra de navegación del calendario */}
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
                      <h2 className="text-base sm:text-lg font-black text-slate-800">{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</h2>
                    </div>
                    <div className="flex items-center gap-2 ml-auto flex-wrap">
                      <div className="flex bg-slate-100 rounded-lg p-0.5">
                        {(['month', 'week', 'list'] as const).map((m) => (
                          <button key={m} onClick={() => setViewMode(m)} className={`px-2 sm:px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-bold transition-all min-h-[36px] ${calendarViewMode === m ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>
                            {m === 'month' ? 'Mes' : m === 'week' ? 'Sem.' : 'Lista'}
                          </button>
                        ))}
                      </div>
                      <span className="bg-slate-200 text-slate-600 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold">{filteredApps.length}</span>
                    </div>
                  </div>

                  {/* Loading skeleton */}
                  {loading && (
                    <div className="p-8 space-y-4 animate-pulse">
                      <div className="grid grid-cols-7 gap-2">
                        {Array(35).fill(0).map((_, i) => (
                          <div key={i} className="h-20 bg-slate-100 rounded-xl" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Vista Lista (móvil por defecto o cuando se elige) */}
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
                              const statusBg = app.status === AppointmentStatus.REALIZED ? 'bg-emerald-50 border-l-emerald-500' : app.status === AppointmentStatus.NO_SHOW ? 'bg-rose-50 border-l-rose-500' : 'bg-slate-50 border-l-primary';
                              return (
                                <button
                                  key={app.id}
                                  onClick={() => setSelectedId(app.id || null)}
                                  onMouseEnter={() => setHoveredAppId(app.id || null)}
                                  onMouseLeave={() => setHoveredAppId(null)}
                                  className={`w-full text-left p-4 rounded-xl border-l-4 ${statusBg} transition-all ${selectedId === app.id ? 'ring-2 ring-primary' : ''}`}
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-bold text-slate-800">{app.patientName}</p>
                                      <p className="text-xs text-slate-500">{app.service}</p>
                                    </div>
                                    <span className="text-sm font-black text-primary">{app.time}</span>
                                  </div>
                                  {hoveredAppId === app.id && (
                                    <div className="mt-2 text-xs text-slate-500 border-t border-slate-200 pt-2">{app.email} · {app.phone}</div>
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
                        <button onClick={() => goToWeek(-1)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                        <button onClick={() => goToWeek(1)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
                      </div>
                      <div className="grid grid-cols-7 min-w-[700px] gap-px bg-slate-200">
                        {weekCells.map((cell) => {
                          const apps = appointmentsByDate[cell.dateStr] || [];
                          const isToday = cell.dateStr === todayISO;
                          return (
                            <div key={cell.dateStr} className={`bg-white min-h-[200px] p-2 ${isToday ? 'ring-2 ring-primary' : ''}`}>
                              <div className={`text-xs font-bold mb-2 ${isToday ? 'text-primary' : 'text-slate-600'}`}>
                                {weekdayShort[cell.date.getDay() === 0 ? 6 : cell.date.getDay() - 1]} {cell.date.getDate()}
                              </div>
                              <div className="space-y-1">
                                {apps.map((app) => {
                                  const statusBg = app.status === AppointmentStatus.REALIZED ? 'bg-emerald-100 border-l-emerald-500' : app.status === AppointmentStatus.NO_SHOW ? 'bg-rose-100 border-l-rose-500' : 'bg-slate-100 border-l-primary';
                                  return (
                                    <button key={app.id} onClick={() => setSelectedId(app.id || null)} className={`w-full text-left px-2 py-1 rounded-r text-[10px] border-l-2 truncate ${statusBg}`}>
                                      {app.time} {app.patientName}
                                    </button>
                                  );
                                })}
                                <button onClick={() => { openCreateModal(cell.dateStr); }} className="w-full text-left px-2 py-1 text-[10px] text-slate-400 hover:bg-slate-50 rounded flex items-center gap-1">
                                  <span className="material-symbols-outlined text-xs">add</span> Nueva
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Cuadrícula del calendario mensual */}
                  {!loading && calendarViewMode === 'month' && (
                  <div className="p-3 sm:p-4 overflow-x-auto flex-1 min-h-0">
                    <div className="min-w-[320px] w-full sm:min-w-[500px] lg:min-w-[600px]">
                      <div className="grid grid-cols-7 border-b border-slate-200">
                        {weekdayShort.map((day) => (
                          <div key={day} className="py-2 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wide border-r border-slate-100 last:border-r-0">
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
                              onClick={(e) => { if ((e.target as HTMLElement).closest('[data-app-id]')) return; openCreateModal(cell.dateStr); }}
                              className={`min-h-[80px] sm:min-h-[100px] lg:min-h-[120px] border-r border-b border-slate-100 p-1 sm:p-1.5 cursor-pointer group ${
                                !cell.isCurrentMonth ? 'bg-slate-50/50' : isToday ? 'bg-primary/5' : 'bg-white hover:bg-slate-50/50'
                              }`}
                            >
                              <div className={`text-[11px] font-bold mb-1 ${!cell.isCurrentMonth ? 'text-slate-300' : isToday ? 'text-primary' : 'text-slate-600'}`}>
                                {cell.date.getDate()}
                              </div>
                              <div className="space-y-1 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                {apps.slice(0, 4).map((app) => {
                                  const statusBg = app.status === AppointmentStatus.REALIZED ? 'bg-emerald-100 border-l-emerald-500' : app.status === AppointmentStatus.NO_SHOW ? 'bg-rose-100 border-l-rose-500' : 'bg-slate-100 border-l-primary';
                                  return (
                                    <div key={app.id} className="relative" data-app-id>
                                      <button
                                        onClick={() => setSelectedId(app.id || null)}
                                        onMouseEnter={() => setHoveredAppId(app.id || null)}
                                        onMouseLeave={() => setHoveredAppId(null)}
                                        className={`w-full text-left px-2 py-1 rounded-r text-[10px] font-medium truncate border-l-2 transition-all hover:opacity-90 ${statusBg} ${selectedId === app.id ? 'ring-2 ring-primary ring-offset-1' : ''}`}
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
                      <button onClick={() => { setFilterStatus('all'); setFilterDate(''); setSearchTerm(''); setFilterService(''); }} className="mt-3 text-primary font-bold hover:underline text-sm">Limpiar filtros</button>
                    </div>
                  )}

                  {/* Mini calendario móvil (colapsable) */}
                  <details className="lg:hidden border-t border-slate-100">
                    <summary className="text-sm font-bold text-slate-600 cursor-pointer flex items-center gap-2 p-4">
                      <span className="material-symbols-outlined text-lg">calendar_month</span> Mini calendario
                    </summary>
                    <div className="p-3 bg-slate-50">{renderMiniCalendar()}</div>
                  </details>
                </div>
              </div>
            ) : activeTab === 'patients' ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-2xl font-black text-slate-800">Registro de Pacientes</h2>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={handleImportPatientsFromCalendar} disabled={importingFromCalendar || appointments.length === 0} className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors disabled:opacity-50">
                      {importingFromCalendar ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">calendar_add_on</span>}
                      {importingFromCalendar ? 'Importando...' : 'Pasar del calendario'}
                    </button>
                    <button onClick={openPatientCreate} className="flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-sm shadow-md transition-colors">
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

                {patientsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : patients.length === 0 ? (
                  <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
                    <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">person_add</span>
                    <p className="text-slate-400 font-bold text-lg">No hay pacientes registrados.</p>
                    <p className="text-slate-300 text-sm mt-1">Añade tu primer paciente para comenzar.</p>
                    <button onClick={openPatientCreate} className="mt-6 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm">Añadir paciente</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {patients.map((p) => (
                      <div key={p.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary">person</span>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => openPatientEdit(p)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-primary transition-colors" title="Editar">
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button onClick={() => handleDeletePatient(p.id!)} className="p-2 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors" title="Eliminar">
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        </div>
                        <h3 className="font-black text-slate-800 text-lg mb-1">{p.name}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-2 mb-1">
                          <span className="material-symbols-outlined text-xs">mail</span> {p.email}
                        </p>
                        <p className="text-sm text-slate-500 flex items-center gap-2 mb-2">
                          <span className="material-symbols-outlined text-xs">call</span> {p.phone}
                        </p>
                        {p.birthDate && (
                          <p className="text-xs text-slate-400 flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-xs">cake</span> {p.birthDate}
                          </p>
                        )}
                        {p.notes && <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 line-clamp-2">{p.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
            <aside className="fixed top-0 right-0 h-full w-full lg:max-w-[500px] lg:w-[500px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right overflow-y-auto pt-[env(safe-area-inset-top)]">
              <div className="p-4 sm:p-6 lg:p-8 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 truncate pr-2">Detalles de Cita</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => { openEditModal(activeApp); }} className="size-10 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-xl transition-colors" title="Editar"><span className="material-symbols-outlined">edit</span></button>
                  <button onClick={() => setSelectedId(null)} className="size-10 flex items-center justify-center text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"><span className="material-symbols-outlined">close</span></button>
                </div>
              </div>
              <div className="p-4 sm:p-6 lg:p-8 flex-1 space-y-6 sm:space-y-8 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
                {/* Cabecera del Detalle con Transición de Color */}
                <div className={`p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem] text-white shadow-xl transition-all duration-500 ${activeApp.status === AppointmentStatus.REALIZED ? 'bg-emerald-600' : activeApp.status === AppointmentStatus.NO_SHOW ? 'bg-rose-600' : 'bg-slate-900'}`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 sm:mb-6">
                    <div className="animate-fade-in min-w-0">
                      <h3 className="text-2xl sm:text-3xl font-black mb-1 break-words">{activeApp.patientName}</h3>
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

                  {/* Añadir a Pacientes */}
                  <button 
                    onClick={() => handleAddAppointmentToPatients(activeApp)}
                    disabled={addingToPatients}
                    className="mt-3 w-full py-3 bg-primary/20 hover:bg-primary/30 text-primary rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {addingToPatients ? (
                      <><span className="material-symbols-outlined animate-spin text-lg">progress_activity</span> Añadiendo...</>
                    ) : (
                      <><span className="material-symbols-outlined text-lg">person_add</span> Añadir a Pacientes</>
                    )}
                  </button>
                  {addToPatientsFeedback === 'ok' && (
                    <p className="mt-2 text-sm font-bold text-emerald-600 flex items-center gap-2">
                      <span className="material-symbols-outlined">check_circle</span> Añadido al registro
                    </p>
                  )}
                  {addToPatientsFeedback === 'exists' && (
                    <p className="mt-2 text-sm font-bold text-amber-600 flex items-center gap-2">
                      <span className="material-symbols-outlined">info</span> Ya está en el registro
                    </p>
                  )}
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

        {/* Modal de confirmación al cambiar estado */}
        {confirmStatusChange && (
          <>
            <div onClick={() => setConfirmStatusChange(null)} className="fixed inset-0 bg-slate-900/50 z-[60]" />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-5 sm:p-8 z-[61] max-w-sm w-full mx-4">
              <p className="text-lg font-bold text-slate-800 mb-4">¿Confirmar cambio de estado?</p>
              <p className="text-sm text-slate-500 mb-6">
                La cita se marcará como <strong>{confirmStatusChange.status === AppointmentStatus.REALIZED ? 'Realizada' : 'No asistió'}</strong>.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmStatusChange(null)} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50">Cancelar</button>
                <button onClick={confirmStatusAndApply} className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark">Confirmar</button>
              </div>
            </div>
          </>
        )}

        {/* Modal Crear/Editar Cita */}
        {appointmentFormModal && (
          <>
            <div onClick={() => setAppointmentFormModal(null)} className="fixed inset-0 bg-slate-900/50 z-[60]" />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-5 sm:p-8 z-[61] max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto my-4">
              <h2 className="text-xl font-black text-slate-800 mb-6">{appointmentFormModal === 'create' ? 'Nueva cita' : 'Editar cita'}</h2>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Servicio</label>
                  <select value={formData.service} onChange={(e) => setFormData({ ...formData, service: e.target.value })} className="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm">
                    {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {formErrors.service && <p className="text-xs text-rose-500 mt-1">{formErrors.service}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre</label>
                  <input type="text" value={formData.patientName} onChange={(e) => setFormData({ ...formData, patientName: e.target.value })} placeholder="Nombre del paciente" className="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm" />
                  {formErrors.patientName && <p className="text-xs text-rose-500 mt-1">{formErrors.patientName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@ejemplo.com" className="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm" />
                  {formErrors.email && <p className="text-xs text-rose-500 mt-1">{formErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teléfono</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+56 9 ..." className="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm" />
                  {formErrors.phone && <p className="text-xs text-rose-500 mt-1">{formErrors.phone}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label>
                    <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm" />
                    {formErrors.date && <p className="text-xs text-rose-500 mt-1">{formErrors.date}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hora</label>
                    <select value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} className="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm">
                      {FIXED_TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notas (opcional)</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} placeholder="Notas..." className="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm resize-none" />
                </div>
                {formErrors.submit && <p className="text-xs text-rose-500">{formErrors.submit}</p>}
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setAppointmentFormModal(null)} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600">Cancelar</button>
                  <button type="submit" disabled={formSubmitting} className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark disabled:opacity-50">
                    {formSubmitting ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* Modal Crear/Editar Paciente */}
        {patientFormModal && (
          <>
            <div onClick={() => setPatientFormModal(null)} className="fixed inset-0 bg-slate-900/50 z-[60]" />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-5 sm:p-8 z-[61] max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto my-4">
              <h2 className="text-xl font-black text-slate-800 mb-6">{patientFormModal === 'create' ? 'Nuevo paciente' : 'Editar paciente'}</h2>
              <form onSubmit={handlePatientFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre completo</label>
                  <input type="text" value={patientFormData.name} onChange={(e) => setPatientFormData({ ...patientFormData, name: e.target.value })} placeholder="Nombre del paciente" className="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm" />
                  {patientFormErrors.name && <p className="text-xs text-rose-500 mt-1">{patientFormErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                  <input type="email" value={patientFormData.email} onChange={(e) => setPatientFormData({ ...patientFormData, email: e.target.value })} placeholder="email@ejemplo.com" className="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm" />
                  {patientFormErrors.email && <p className="text-xs text-rose-500 mt-1">{patientFormErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teléfono</label>
                  <input type="tel" value={patientFormData.phone} onChange={(e) => setPatientFormData({ ...patientFormData, phone: e.target.value })} placeholder="+56 9 ..." className="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm" />
                  {patientFormErrors.phone && <p className="text-xs text-rose-500 mt-1">{patientFormErrors.phone}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha de nacimiento (opcional)</label>
                  <input type="date" value={patientFormData.birthDate} onChange={(e) => setPatientFormData({ ...patientFormData, birthDate: e.target.value })} className="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notas (opcional)</label>
                  <textarea value={patientFormData.notes} onChange={(e) => setPatientFormData({ ...patientFormData, notes: e.target.value })} rows={3} placeholder="Observaciones, alergias, etc." className="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm resize-none" />
                </div>
                {patientFormErrors.submit && <p className="text-xs text-rose-500">{patientFormErrors.submit}</p>}
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setPatientFormModal(null)} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600">Cancelar</button>
                  <button type="submit" disabled={patientFormSubmitting} className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark disabled:opacity-50">
                    {patientFormSubmitting ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
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
