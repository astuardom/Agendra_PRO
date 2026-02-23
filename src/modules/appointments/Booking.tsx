
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createAppointment } from '@/services/appointmentService';

interface FormErrors {
  patientName?: string;
  phone?: string;
  email?: string;
  service?: string;
}

const Booking: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(defaultDateStr);
  const [selectedTime, setSelectedTime] = useState('10:00');
  
  const [formData, setFormData] = useState({
    service: 'Psicoterapia Individual',
    patientName: '',
    phone: '',
    email: ''
  });

  const fixedTimes = ['09:00', '10:15', '11:30', '15:00', '16:15', '17:30', '18:45'];

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const validateField = (name: string, value: string) => {
    let err = "";
    const cleanValue = value.trim();

    if (name === 'patientName') {
      if (cleanValue.length === 0) err = "El nombre es obligatorio.";
      else if (cleanValue.length < 3) err = "El nombre debe tener al menos 3 caracteres.";
      else if (cleanValue.length > 50) err = "El nombre es demasiado largo (máx 50).";
      else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(cleanValue)) err = "El nombre solo debe contener letras.";
    } 
    else if (name === 'email') {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (cleanValue.length === 0) err = "El correo es obligatorio.";
      else if (!emailRegex.test(cleanValue)) err = "Ingresa un correo electrónico válido (ej: nombre@dominio.com).";
    } 
    else if (name === 'phone') {
      const digits = cleanValue.replace(/\D/g, "");
      if (cleanValue.length === 0) err = "El teléfono es obligatorio.";
      else if (digits.length < 8) err = "El teléfono debe tener al menos 8 dígitos.";
      else if (digits.length > 15) err = "El teléfono es demasiado largo.";
    }
    else if (name === 'service') {
      if (cleanValue.length === 0) err = "Debes seleccionar un servicio.";
    }

    setFieldErrors(prev => ({ ...prev, [name]: err }));
    return err === "";
  };

  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const days = [];
    const totalDays = daysInMonth(currentMonth, currentYear);
    const firstDay = firstDayOfMonth(currentMonth, currentYear);
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= totalDays; d++) days.push(new Date(currentYear, currentMonth, d));
    return days;
  }, [currentMonth, currentYear]);

  const handleMonthChange = (offset: number) => {
    let newMonth = currentMonth + offset;
    let newYear = currentYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    else if (newMonth > 11) { newMonth = 0; newYear++; }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const isDateDisabled = (date: Date) => {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    const t = new Date();
    t.setHours(0,0,0,0);
    return d <= t || date.getDay() === 0; 
  };

  const isSelected = (date: Date) => date.toISOString().split('T')[0] === selectedDate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isNameValid = validateField('patientName', formData.patientName);
    const isEmailValid = validateField('email', formData.email);
    const isPhoneValid = validateField('phone', formData.phone);
    const isServiceValid = validateField('service', formData.service);

    if (!isNameValid || !isEmailValid || !isPhoneValid || !isServiceValid) {
      setError("Por favor, corrige los errores en el formulario.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const appointmentData = { ...formData, date: selectedDate, time: selectedTime };
      await createAppointment(appointmentData);
      navigate('/confirmation', { state: { appointment: appointmentData } });
    } catch (err) {
      setError("Hubo un problema al procesar tu reserva. Por favor intenta de nuevo.");
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // No validamos inmediatamente en cada tecla para evitar frustración, solo si ya hay un error
    if (fieldErrors[name as keyof FormErrors]) {
      validateField(name, value);
    }
  };

  return (
    <div className="min-h-screen bg-background-alt py-8 sm:py-12 px-4 sm:px-6 md:px-20 overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-12 flex flex-col items-center gap-3">
          <span className="bg-indigo-50 text-primary px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Inicia tu proceso</span>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-900">Agenda tu Sesión</h1>
          <p className="text-text-secondary text-lg max-w-xl">Elige el momento que mejor se adapte a tu semana para nuestro encuentro.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start">
          <div className="lg:col-span-7 flex flex-col gap-6 sm:gap-8">
            <div className="bg-white p-4 sm:p-6 md:p-10 rounded-2xl sm:rounded-[2.5rem] shadow-xl border border-slate-100">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold text-slate-800">{monthNames[currentMonth]} {currentYear}</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleMonthChange(-1)} className="p-2 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100"><span className="material-symbols-outlined">chevron_left</span></button>
                  <button type="button" onClick={() => handleMonthChange(1)} className="p-2 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100"><span className="material-symbols-outlined">chevron_right</span></button>
                </div>
              </div>
              <div className="grid grid-cols-7 mb-4 text-center">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                  <div key={d} className="text-[10px] font-black text-slate-300 uppercase tracking-widest pb-6">{d}</div>
                ))}
                {calendarDays.map((date, idx) => {
                  if (!date) return <div key={`empty-${idx}`} />;
                  const disabled = isDateDisabled(date);
                  const selected = isSelected(date);
                  return (
                    <button
                      type="button"
                      key={idx}
                      disabled={disabled}
                      onClick={() => setSelectedDate(date.toISOString().split('T')[0])}
                      className={`aspect-square flex items-center justify-center rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all relative mb-1 min-h-[36px] ${disabled ? 'text-slate-200 cursor-not-allowed' : selected ? 'bg-primary text-white shadow-xl scale-105 sm:scale-110 z-10' : 'text-slate-600 hover:bg-indigo-50 hover:text-primary active:bg-indigo-50'}`}
                    >
                      {date.getDate()}
                      {date.toDateString() === today.toDateString() && !selected && <span className="absolute bottom-2 size-1 bg-primary rounded-full" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <h3 className="flex items-center gap-2 text-xl font-bold text-slate-800">
                <span className="material-symbols-outlined text-primary filled-icon">schedule</span>
                Horarios para el {selectedDate}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {fixedTimes.map(time => (
                  <button
                    type="button"
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`px-4 py-4 rounded-2xl text-sm font-bold transition-all border ${selectedTime === time ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-slate-100 text-slate-600 hover:border-primary hover:text-primary'}`}
                  >
                    {time} hrs
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2.5rem] shadow-2xl border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Tus Datos</h3>
              <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
                <div className="space-y-5">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="service" className="text-xs font-bold uppercase text-slate-400 tracking-wide">Motivo de Sesión</label>
                    <select 
                      id="service"
                      name="service"
                      className={`w-full rounded-2xl border py-3.5 px-4 text-sm focus:ring-primary outline-none transition-colors ${fieldErrors.service ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`}
                      value={formData.service}
                      onChange={handleInputChange}
                      onBlur={(e) => validateField('service', e.target.value)}
                    >
                      <option value="Psicoterapia Individual">Psicoterapia Individual</option>
                      <option value="Terapia de Pareja">Terapia de Pareja</option>
                      <option value="Evaluación Clínica">Evaluación Clínica</option>
                      <option value="Acompañamiento Duelo">Acompañamiento Duelo</option>
                    </select>
                    {fieldErrors.service && <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1 animate-pulse"><span className="material-symbols-outlined text-xs">error</span> {fieldErrors.service}</p>}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="patientName" className="text-xs font-bold uppercase text-slate-400 tracking-wide">Nombre Completo</label>
                    <input 
                      id="patientName"
                      name="patientName"
                      type="text" required placeholder="Tu nombre"
                      aria-invalid={!!fieldErrors.patientName}
                      className={`w-full rounded-2xl border py-3.5 px-4 text-sm focus:ring-primary outline-none transition-colors ${fieldErrors.patientName ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`}
                      value={formData.patientName}
                      onChange={handleInputChange}
                      onBlur={(e) => validateField('patientName', e.target.value)}
                    />
                    {fieldErrors.patientName && <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1 animate-pulse"><span className="material-symbols-outlined text-xs">error</span> {fieldErrors.patientName}</p>}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="phone" className="text-xs font-bold uppercase text-slate-400 tracking-wide">WhatsApp / Teléfono</label>
                    <input 
                      id="phone"
                      name="phone"
                      type="tel" required placeholder="+56 9"
                      aria-invalid={!!fieldErrors.phone}
                      className={`w-full rounded-2xl border py-3.5 px-4 text-sm focus:ring-primary outline-none transition-colors ${fieldErrors.phone ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`}
                      value={formData.phone}
                      onChange={handleInputChange}
                      onBlur={(e) => validateField('phone', e.target.value)}
                    />
                    {fieldErrors.phone && <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1 animate-pulse"><span className="material-symbols-outlined text-xs">error</span> {fieldErrors.phone}</p>}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="text-xs font-bold uppercase text-slate-400 tracking-wide">Email</label>
                    <input 
                      id="email"
                      name="email"
                      type="email" required placeholder="email@ejemplo.com"
                      aria-invalid={!!fieldErrors.email}
                      className={`w-full rounded-2xl border py-3.5 px-4 text-sm focus:ring-primary outline-none transition-colors ${fieldErrors.email ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`}
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={(e) => validateField('email', e.target.value)}
                    />
                    {fieldErrors.email && <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1 animate-pulse"><span className="material-symbols-outlined text-xs">error</span> {fieldErrors.email}</p>}
                  </div>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 mb-1">Resumen de reserva:</p>
                  <p className="text-primary font-black text-base">{selectedDate} a las {selectedTime} hrs</p>
                </div>
                {error && <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-100 animate-bounce-short">{error}</div>}
                <button 
                  type="submit" disabled={loading}
                  className="w-full py-5 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                >
                  {loading ? <span className="animate-spin material-symbols-outlined">progress_activity</span> : 'Confirmar Reserva'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-short { animation: bounce-short 0.5s ease-in-out; }
      `}</style>
    </div>
  );
};

export default Booking;
