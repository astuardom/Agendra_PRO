
import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  const services = [
    {
      title: 'Psicoterapia Individual',
      desc: 'Un espacio confidencial para trabajar en ansiedad, depresión, autoestima y procesos de cambio personal.',
      duration: '50 min',
      image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800'
    },
    {
      title: 'Terapia de Pareja',
      desc: 'Enfoque en la resolución de conflictos, mejora de la comunicación y fortalecimiento del vínculo emocional.',
      duration: '75 min',
      image: 'https://images.unsplash.com/photo-1611067460204-e43ec4a2efa3?auto=format&fit=crop&q=80&w=800'
    },
    {
      title: 'Evaluación Psicológica',
      desc: 'Procesos diagnósticos detallados para entender tu perfil cognitivo y emocional de forma integral.',
      duration: '60 min',
      image: 'https://images.unsplash.com/photo-1620302044935-444961a5d028?auto=format&fit=crop&q=80&w=800'
    }
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="px-6 md:px-20 py-12 lg:py-24 bg-white flex justify-center">
        <div className="flex flex-col lg:flex-row items-center gap-12 max-w-[1200px]">
          <div className="flex flex-col gap-8 lg:w-1/2 text-center lg:text-left">
            <h1 className="text-text-main text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
              Encuentra el <span className="text-primary">bienestar</span> emocional que buscas
            </h1>
            <p className="text-text-secondary text-lg leading-relaxed max-w-[600px] mx-auto lg:mx-0">
              Inicia un proceso de autodescubrimiento y sanación en un entorno seguro y profesional. Agenda tu primera sesión online de forma discreta y sencilla.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/booking" className="flex min-w-[160px] items-center justify-center rounded-xl h-14 px-8 bg-primary hover:bg-primary-dark shadow-lg shadow-indigo-200 transition-all hover:scale-105 text-white font-bold">
                Agendar Sesión
              </Link>
              <Link to="/about" className="flex min-w-[160px] items-center justify-center rounded-xl h-14 px-8 bg-white border border-slate-200 hover:bg-slate-50 text-text-main font-bold transition-colors">
                Mi Metodología
              </Link>
            </div>
          </div>
          <div className="w-full lg:w-1/2 aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl relative border-8 border-slate-50 bg-slate-100">
            <img 
              src="https://images.unsplash.com/photo-1525498128493-380d1990a112?auto=format&fit=crop&q=80&w=1200" 
              alt="Psicoterapia Office" 
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* Why Therapy */}
      <section className="w-full bg-background-alt py-20 px-6 md:px-20 flex justify-center">
        <div className="flex flex-col max-w-[1200px] flex-1 gap-12">
          <div className="flex flex-col gap-3 text-center">
            <h2 className="text-primary font-bold tracking-wider text-sm uppercase">Cuidado Profesional</h2>
            <h3 className="text-text-main text-3xl lg:text-4xl font-extrabold">Un espacio para ti</h3>
            <p className="text-text-secondary text-lg max-w-[600px] mx-auto">Priorizar tu salud mental es el primer paso hacia una vida más plena.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: 'shield_moon', title: 'Confidencialidad', desc: 'Tu privacidad es absoluta. Todo lo compartido queda bajo secreto profesional.' },
              { icon: 'favorite', title: 'Empatía Real', desc: 'Un vínculo terapéutico basado en la escucha activa y la ausencia de juicios.' },
              { icon: 'verified', title: 'Evidencia Científica', desc: 'Utilizo metodologías validadas para garantizar resultados efectivos.' },
              { icon: 'devices', title: 'Flexibilidad', desc: 'Opciones de terapia presencial y online según tus necesidades.' }
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-primary mb-4">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <h4 className="text-text-main text-lg font-bold mb-2">{item.title}</h4>
                <p className="text-text-secondary text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="w-full bg-white py-20 px-6 md:px-20 flex justify-center">
        <div className="flex flex-col max-w-[1000px] flex-1 gap-12">
          <div className="text-center">
            <h2 className="text-text-main text-3xl font-extrabold mb-4">Comienza hoy</h2>
            <p className="text-text-secondary text-lg">Reserva tu espacio en solo minutos</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: '1', t: 'Elige tu Modalidad', d: 'Selecciona el tipo de terapia que buscas.' },
              { n: '2', t: 'Selecciona Horario', d: 'Visualiza mi disponibilidad real y reserva el bloque que prefieras.' },
              { n: '3', t: 'Encuentro Terapéutico', d: 'Recibirás un mail con el enlace o dirección para nuestra sesión.' }
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl mb-6 shadow-lg ring-4 ring-slate-50">{step.n}</div>
                <h3 className="text-lg font-bold text-text-main mb-2">{step.t}</h3>
                <p className="text-text-secondary text-sm">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="w-full bg-background-alt py-20 px-6 md:px-20 flex justify-center">
        <div className="flex flex-col max-w-[1200px] flex-1 gap-10">
          <div className="flex justify-between items-end gap-4">
            <div>
              <h2 className="text-text-main text-3xl font-extrabold mb-2">Servicios Terapéuticos</h2>
              <p className="text-text-secondary">Encuentros diseñados para tu crecimiento</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col group hover:border-primary/30 transition-all">
                <div className="mb-4 h-52 rounded-2xl bg-slate-100 overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
                <h3 className="text-xl font-bold text-text-main mb-2">{service.title}</h3>
                <p className="text-text-secondary text-sm mb-6 flex-1">{service.desc}</p>
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm font-semibold text-slate-500">{service.duration}</span>
                  <Link to="/booking" className="text-primary font-bold text-sm px-6 py-2.5 rounded-xl bg-indigo-50 hover:bg-primary hover:text-white transition-all">Reservar</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-20 py-20 flex justify-center bg-white">
        <div className="w-full max-w-[1200px] rounded-[3rem] bg-slate-900 text-white p-12 md:p-20 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden shadow-2xl">
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
          <div className="flex flex-col gap-6 relative z-10 text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-black leading-tight">Tu salud mental <br/>no puede esperar.</h2>
            <p className="text-slate-400 text-lg max-w-[500px]">Agenda tu sesión inicial hoy y demos el primer paso juntos hacia tu bienestar.</p>
          </div>
          <Link to="/booking" className="relative z-10 min-w-[240px] h-16 bg-primary text-white text-lg font-bold rounded-2xl hover:bg-primary-dark transition-all shadow-xl flex items-center justify-center gap-2 hover:translate-y-[-4px]">
            Agendar Sesión <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
