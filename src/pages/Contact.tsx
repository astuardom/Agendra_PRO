
import React, { useState } from 'react';
import { db } from '@/core/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface ContactErrors {
  name?: string;
  email?: string;
  message?: string;
}

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [fieldErrors, setFieldErrors] = useState<ContactErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateField = (name: string, value: string) => {
    let err = "";
    const cleanValue = value.trim();

    if (name === 'name') {
      if (cleanValue.length === 0) err = "El nombre es obligatorio.";
      else if (cleanValue.length < 3) err = "El nombre es muy corto.";
      else if (cleanValue.length > 50) err = "El nombre es demasiado largo.";
    } 
    else if (name === 'email') {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (cleanValue.length === 0) err = "El correo electrónico es obligatorio.";
      else if (!emailRegex.test(cleanValue)) err = "Por favor, ingresa un correo electrónico válido.";
    } 
    else if (name === 'message') {
      if (cleanValue.length === 0) err = "El mensaje no puede estar vacío.";
      else if (cleanValue.length < 15) err = "El mensaje es muy corto, cuéntanos un poco más (mín. 15 carac.).";
      else if (cleanValue.length > 1000) err = "El mensaje no puede exceder los 1000 caracteres.";
    }
    
    setFieldErrors(prev => ({ ...prev, [name]: err }));
    return err === "";
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof ContactErrors]) {
      validateField(name, value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isNameValid = validateField('name', formData.name);
    const isEmailValid = validateField('email', formData.email);
    const isMessageValid = validateField('message', formData.message);

    if (!isNameValid || !isEmailValid || !isMessageValid) {
      setError("Por favor, completa correctamente todos los campos obligatorios.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addDoc(collection(db, 'messages'), {
        ...formData,
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
        status: 'new'
      });
      setSuccess(true);
      setFormData({ name: '', email: '', message: '' });
      setFieldErrors({});
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
      setError("Hubo un fallo en la conexión. Por favor, revisa tu internet e inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light py-8 sm:py-12 px-4 sm:px-6 md:px-20 lg:px-40 overflow-x-hidden">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-8">
        <div className="flex gap-2 text-slate-500 text-sm font-medium">
          <a href="/" className="hover:text-primary transition-colors">Inicio</a> / <span>Contacto</span>
        </div>
        
        <div className="flex flex-col gap-3 max-w-2xl mb-4">
          <h1 className="text-4xl md:text-5xl font-black text-text-main tracking-tight">Contacto</h1>
          <p className="text-text-secondary text-lg">Estamos aquí para ayudarte. Envíanos un mensaje y te responderemos lo antes posible.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold text-text-main mb-4">Información Directa</h3>
              <div className="space-y-4">
                {[
                  { icon: 'call', label: '+56 9 1234 5678', sub: 'Atención Telefónica' },
                  { icon: 'mail', label: 'contacto@mentesana.cl', sub: 'Consultas Generales' },
                  { icon: 'location_on', label: 'Av. Providencia 1234, Of 505', sub: 'Consultorio' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-slate-50 hover:border-primary/20 transition-all">
                    <div className="size-10 rounded-lg bg-blue-50 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-xl">{item.icon}</span>
                    </div>
                    <div>
                      <p className="font-bold text-text-main text-sm">{item.label}</p>
                      <p className="text-[10px] text-text-secondary uppercase font-bold">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl">
              <h3 className="text-xl font-bold mb-2">Horario de Atención</h3>
              <p className="text-slate-400 text-sm mb-6">Agenda tu cita dentro de estos bloques horarios.</p>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Lunes - Jueves</span>
                  <span className="font-bold">09:00 - 19:30</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Viernes</span>
                  <span className="font-bold">09:00 - 15:00</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                  <span className="text-slate-400">Sábado - Domingo</span>
                  <span className="text-rose-400 font-bold uppercase text-[10px]">Cerrado</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-slate-100">
              <h3 className="text-2xl font-black text-text-main mb-6">Envíanos un mensaje</h3>
              
              {success ? (
                <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-2xl text-center flex flex-col items-center gap-4 animate-fade-in-up">
                  <div className="size-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                    <span className="material-symbols-outlined text-3xl">check</span>
                  </div>
                  <h4 className="text-xl font-bold text-emerald-900">¡Mensaje Enviado!</h4>
                  <p className="text-emerald-700 text-sm">Gracias por contactarnos. Te responderemos a la brevedad posible.</p>
                  <button onClick={() => setSuccess(false)} className="mt-4 text-emerald-600 font-bold text-sm hover:underline">Enviar otro mensaje</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  {error && (
                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl text-rose-600 text-sm font-bold flex items-center gap-2 animate-pulse">
                      <span className="material-symbols-outlined">error</span> {error}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label htmlFor="name" className="text-xs font-bold uppercase text-slate-500 tracking-wider">Nombre Completo</label>
                      <input 
                        id="name"
                        name="name"
                        type="text" 
                        required 
                        aria-invalid={!!fieldErrors.name}
                        className={`w-full rounded-xl border py-3 px-4 focus:ring-primary focus:border-primary transition-colors outline-none ${fieldErrors.name ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`}
                        placeholder="Ej. Juan Pérez"
                        value={formData.name}
                        onChange={handleInputChange}
                        onBlur={(e) => validateField('name', e.target.value)}
                      />
                      {fieldErrors.name && <p className="text-[10px] font-bold text-rose-500 mt-1 flex items-center gap-1 animate-fadeInScale"><span className="material-symbols-outlined text-xs">error</span> {fieldErrors.name}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="email" className="text-xs font-bold uppercase text-slate-500 tracking-wider">Correo Electrónico</label>
                      <input 
                        id="email"
                        name="email"
                        type="email" 
                        required 
                        aria-invalid={!!fieldErrors.email}
                        className={`w-full rounded-xl border py-3 px-4 focus:ring-primary focus:border-primary transition-colors outline-none ${fieldErrors.email ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`}
                        placeholder="juan@ejemplo.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={(e) => validateField('email', e.target.value)}
                      />
                      {fieldErrors.email && <p className="text-[10px] font-bold text-rose-500 mt-1 flex items-center gap-1 animate-fadeInScale"><span className="material-symbols-outlined text-xs">error</span> {fieldErrors.email}</p>}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="message" className="text-xs font-bold uppercase text-slate-500 tracking-wider">Mensaje o Consulta</label>
                    <textarea 
                      id="message"
                      name="message"
                      required 
                      rows={5}
                      aria-invalid={!!fieldErrors.message}
                      className={`w-full rounded-xl border py-3 px-4 focus:ring-primary focus:border-primary resize-none transition-colors outline-none ${fieldErrors.message ? 'border-rose-500 bg-rose-50' : 'border-slate-200'}`}
                      placeholder="Cuéntanos en qué podemos ayudarte..."
                      value={formData.message}
                      onChange={handleInputChange}
                      onBlur={(e) => validateField('message', e.target.value)}
                    ></textarea>
                    {fieldErrors.message && <p className="text-[10px] font-bold text-rose-500 mt-1 flex items-center gap-1 animate-fadeInScale"><span className="material-symbols-outlined text-xs">error</span> {fieldErrors.message}</p>}
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
                  >
                    {loading ? (
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    ) : (
                      <>Enviar Mensaje <span className="material-symbols-outlined">send</span></>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeInScale { animation: fadeInScale 0.2s ease-out; }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default Contact;
