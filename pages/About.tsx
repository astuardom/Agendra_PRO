
import React from 'react';
import { Link } from 'react-router-dom';

const About: React.FC = () => {
  return (
    <div className="flex flex-col bg-white">
      {/* Intro section */}
      <section className="px-6 md:px-20 py-16 lg:py-24 max-w-[1280px] mx-auto w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex flex-col gap-8 flex-1 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 w-fit border border-indigo-100">
              <span className="text-primary text-xs font-bold uppercase tracking-wide">Mi Formación</span>
            </div>
            <h1 className="text-text-main text-4xl md:text-5xl font-black leading-tight tracking-tight">
              Acompañamiento profesional y humano
            </h1>
            <p className="text-text-secondary text-lg leading-relaxed max-w-xl">
              Soy Alejandro Martínez, psicólogo clínico especializado en terapia sistémica y cognitiva. Mi objetivo es brindarte herramientas prácticas para gestionar tus emociones y mejorar tu calidad de vida.
            </p>
            <div className="flex gap-4">
              <Link to="/booking" className="flex min-w-[160px] items-center justify-center rounded-xl h-12 px-6 bg-primary hover:bg-primary-dark text-white font-bold transition-all shadow-md">
                Agendar ahora
              </Link>
              <Link to="/contact" className="flex min-w-[160px] items-center justify-center rounded-xl h-12 px-6 border border-slate-200 hover:bg-slate-50 text-text-main font-medium transition-colors">
                Contactar
              </Link>
            </div>
          </div>
          <div className="w-full flex-1 aspect-square md:aspect-[4/3] rounded-[2.5rem] overflow-hidden shadow-2xl bg-slate-100">
            <img 
              src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=1000" 
              alt="Ps. Alejandro" 
              className="w-full h-full object-cover" 
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="w-full px-6 py-20 bg-slate-50 border-y border-slate-100">
        <div className="flex flex-col items-center text-center max-w-[800px] mx-auto gap-8">
          <span className="material-symbols-outlined text-primary text-6xl opacity-20">psychology_alt</span>
          <h2 className="text-text-main tracking-tight text-2xl md:text-3xl font-medium leading-snug italic">
            “Entiendo la terapia no como un lugar de 'cura', sino como un proceso de aprendizaje donde la persona recupera su autonomía y su capacidad de disfrutar la vida.”
          </h2>
          <div className="w-16 h-1 bg-primary rounded-full"></div>
        </div>
      </section>

      {/* Experience */}
      <section className="w-full px-6 py-20">
        <div className="max-w-[1024px] mx-auto flex flex-col md:flex-row rounded-[2.5rem] bg-white shadow-2xl overflow-hidden border border-slate-100">
          <div className="w-full md:w-2/5 min-h-[400px] bg-slate-100">
             <img 
              src="https://images.unsplash.com/photo-1693423362454-7db6c8e07a5c?auto=format&fit=crop&q=80&w=800" 
              className="w-full h-full object-cover" 
              alt="Therapy Session" 
              loading="lazy"
            />
          </div>
          <div className="flex flex-1 flex-col justify-center p-8 md:p-14 gap-8">
            <div className="flex flex-col gap-4">
              <p className="text-primary text-sm font-bold uppercase tracking-wider">Mi Enfoque</p>
              <h3 className="text-3xl font-bold text-slate-900">Un camino de crecimiento</h3>
              <div className="space-y-4 text-text-secondary text-base leading-relaxed">
                <p>Cuento con una maestría en Psicología Clínica y más de una década de experiencia acompañando a adultos y parejas en sus procesos de cambio.</p>
                <p>Mi enfoque integra la Terapia Cognitivo-Conductual con una visión humanista, permitiendo que cada proceso sea único y adaptado al ritmo de cada consultante.</p>
              </div>
            </div>
            <div className="flex items-center gap-10 pt-6 border-t border-slate-100">
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-bold uppercase">Especialidad</span>
                <span className="text-slate-800 font-bold">Psicoterapia Clínica</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 font-bold uppercase">Registro Sanitario</span>
                <span className="text-slate-800 font-bold">#144.225-C</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Commitment */}
      <section className="w-full px-6 py-24 bg-slate-50">
        <div className="max-w-[1280px] mx-auto flex flex-col gap-16">
          <div className="text-center max-w-[720px] mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">Principios de mi Práctica</h2>
            <p className="text-text-secondary text-lg mt-4">Valores fundamentales para una terapia efectiva y ética.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: 'handshake', title: 'Alianza Terapéutica', desc: 'Construimos juntos un equipo de trabajo basado en la confianza mutua.' },
              { icon: 'verified', title: 'Ética y Rigor', desc: 'Respeto total a los códigos deontológicos y actualización constante.' },
              { icon: 'self_improvement', title: 'Bienestar Integral', desc: 'No solo tratamos síntomas, buscamos un equilibrio emocional duradero.' }
            ].map((pillar, idx) => (
              <div key={idx} className="bg-white p-12 rounded-[2rem] shadow-sm hover:shadow-2xl transition-all border border-transparent hover:border-indigo-100 group">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-primary mb-8 group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined text-3xl">{pillar.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{pillar.title}</h3>
                <p className="text-text-secondary leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
