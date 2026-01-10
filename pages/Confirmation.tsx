
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Confirmation: React.FC = () => {
  const location = useLocation();
  const appointment = location.state?.appointment || {
    patientName: "Paciente",
    service: "Terapia Individual",
    date: "Pendiente",
    time: "Pendiente",
    email: "correo@ejemplo.com"
  };

  const handleDownload = () => {
    const receiptContent = `
=========================================
      COMPROBANTE DE SESIÓN TERAPÉUTICA
      Ps. Alejandro Martínez
=========================================

DETALLES DE LA RESERVA:
-----------------------------------------
Paciente: ${appointment.patientName}
Modalidad: ${appointment.service}
Fecha: ${appointment.date}
Hora: ${appointment.time} hrs

INFORMACIÓN IMPORTANTE:
-----------------------------------------
Email: ${appointment.email}
Dirección: Providencia 1234, Santiago
Enlace Online: Se enviará 15 min antes

-----------------------------------------
Este espacio ha sido reservado para ti.
Si necesitas reprogramar, por favor
hazlo con al menos 24h de antelación.

=========================================
    `.trim();

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `confirmacion-sesion-${appointment.patientName.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full animate-fade-in-up">
        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-10 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-3 bg-primary"></div>
          <div className="size-24 bg-indigo-50 rounded-full flex items-center justify-center mb-8 ring-8 ring-indigo-50/50">
            <span className="material-symbols-outlined text-primary text-6xl font-bold filled-icon">sentiment_satisfied</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">¡Sesión Agendada!</h1>
          <p className="text-slate-500 mb-10 text-sm leading-relaxed max-w-[300px]">
            Tu espacio ha sido reservado con éxito. Pronto recibirás un mail con las instrucciones.
          </p>
          <div className="w-full bg-slate-50 rounded-3xl p-8 border border-slate-100 mb-10 text-left">
            <div className="space-y-6">
              {[
                { i: 'calendar_today', l: 'Fecha y Hora', v: appointment.date, s: `${appointment.time} hrs` },
                { i: 'psychology', l: 'Modalidad', v: appointment.service, s: 'Sesión Clínica' },
                { i: 'person', l: 'Consultante', v: appointment.patientName, s: appointment.email }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="size-10 rounded-xl bg-white border flex items-center justify-center text-primary shadow-sm shrink-0">
                    <span className="material-symbols-outlined text-[20px]">{item.i}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.l}</p>
                    <p className="text-sm font-black text-slate-800">{item.v}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{item.s}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col w-full gap-4">
            <Link to="/" className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2">
              Volver al Inicio
            </Link>
            <button onClick={handleDownload} className="w-full py-4 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
              Descargar Comprobante
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;
