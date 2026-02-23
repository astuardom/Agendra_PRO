import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/modules/auth';
import { ProtectedRoute, GuestRoute } from '@/shared/components';
import Home from '@/pages/Home';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Login from '@/pages/Login';
import { Dashboard } from '@/modules/dashboard';
import Booking from '@/modules/appointments/Booking';
import Confirmation from '@/modules/appointments/Confirmation';

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const isDashboard = location.pathname.startsWith('/dashboard');

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (isDashboard || location.pathname === '/login') return null;

  const navLinks = (
    <>
      <Link to="/" className={`block py-3 px-4 rounded-xl text-base font-semibold transition-colors min-h-[44px] flex items-center ${location.pathname === '/' ? 'text-primary bg-primary/10' : 'text-text-main hover:bg-slate-100'}`}>Inicio</Link>
      <Link to="/about" className={`block py-3 px-4 rounded-xl text-base font-semibold transition-colors min-h-[44px] flex items-center ${location.pathname === '/about' ? 'text-primary bg-primary/10' : 'text-text-main hover:bg-slate-100'}`}>Mi Enfoque</Link>
      <Link to="/booking" className={`block py-3 px-4 rounded-xl text-base font-bold transition-colors min-h-[44px] flex items-center gap-2 ${location.pathname === '/booking' ? 'bg-primary text-white' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'}`}>
        <span className="material-symbols-outlined text-lg">calendar_today</span>
        Agendar Sesión
      </Link>
      <Link to="/contact" className={`block py-3 px-4 rounded-xl text-base font-semibold transition-colors min-h-[44px] flex items-center ${location.pathname === '/contact' ? 'text-primary bg-primary/10' : 'text-text-main hover:bg-slate-100'}`}>Contacto</Link>
    </>
  );

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f2f4] bg-white/95 backdrop-blur-md px-4 sm:px-6 md:px-20 py-3 sm:py-4 safe-area-inset-top">
        <Link to="/" className="flex items-center gap-2 sm:gap-4 text-primary min-h-[44px] items-center">
          <span className="material-symbols-outlined text-2xl sm:text-3xl filled-icon">psychology</span>
          <h2 className="text-text-main text-base sm:text-xl font-extrabold leading-tight tracking-[-0.015em] truncate max-w-[180px] sm:max-w-none">Ps. Alejandro Martínez</h2>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link to="/" className={`text-sm font-semibold transition-colors py-2 px-3 rounded-lg min-h-[44px] flex items-center ${location.pathname === '/' ? 'text-primary' : 'text-text-main hover:text-primary'}`}>Inicio</Link>
            <Link to="/about" className={`text-sm font-semibold transition-colors py-2 px-3 rounded-lg min-h-[44px] flex items-center ${location.pathname === '/about' ? 'text-primary' : 'text-text-main hover:text-primary'}`}>Mi Enfoque</Link>
            <Link to="/booking" className={`text-sm font-bold px-4 py-2.5 rounded-full transition-all flex items-center gap-2 min-h-[44px] ${location.pathname === '/booking' ? 'bg-primary text-white shadow-lg' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'}`}>
              <span className="material-symbols-outlined text-sm">calendar_today</span>
              Agendar Sesión
            </Link>
            <Link to="/contact" className={`text-sm font-semibold transition-colors py-2 px-3 rounded-lg min-h-[44px] flex items-center ${location.pathname === '/contact' ? 'text-primary' : 'text-text-main hover:text-primary'}`}>Contacto</Link>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link to="/dashboard" className="hidden sm:flex items-center justify-center rounded-lg min-h-[44px] min-w-[44px] px-4 bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 text-sm font-bold">
                  Panel Admin
                </Link>
                <button onClick={handleLogout} className="flex cursor-pointer items-center justify-center rounded-lg min-h-[44px] min-w-[44px] px-4 bg-slate-900 hover:bg-black transition-colors text-white text-sm font-bold shadow-sm">
                  Salir
                </button>
              </>
            ) : (
              <Link to="/login" className="flex min-w-[44px] min-h-[44px] cursor-pointer items-center justify-center rounded-lg px-4 sm:px-6 bg-slate-900 hover:bg-black transition-colors text-white text-sm font-bold shadow-sm">
                Ingresar
              </Link>
            )}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden flex items-center justify-center w-12 h-12 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors" aria-label="Menú">
              <span className="material-symbols-outlined text-2xl">{menuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
      </header>
      <div onClick={() => setMenuOpen(false)} className={`md:hidden fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-sm transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} aria-hidden={!menuOpen} />
      <nav aria-hidden={!menuOpen} className={`md:hidden fixed top-0 left-0 h-full w-[280px] max-w-[85vw] bg-white shadow-2xl z-50 flex flex-col pt-[calc(56px+env(safe-area-inset-top))] transition-transform duration-300 ease-out overflow-hidden ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col p-4 gap-1 overflow-y-auto">
          {navLinks}
        </div>
      </nav>
    </>
  );
};

const Footer: React.FC = () => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname === '/login';

  if (isDashboard) return null;

  return (
    <footer className="border-t border-gray-100 bg-white pt-12 sm:pt-16 pb-8 px-4 sm:px-6 md:px-20 flex justify-center pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="flex flex-col max-w-[1200px] flex-1 gap-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-primary font-bold text-xl">
              <span className="material-symbols-outlined filled-icon">psychology</span>
              Ps. Alejandro M.
            </div>
            <p className="text-text-secondary text-sm">Un espacio seguro para tu bienestar emocional y crecimiento personal.</p>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-text-main">Terapia</h4>
            <div className="flex flex-col gap-2 text-sm text-text-secondary">
              <Link to="/booking" className="hover:text-primary transition-colors">Sesión Individual</Link>
              <Link to="/booking" className="hover:text-primary transition-colors">Terapia de Pareja</Link>
              <Link to="/booking" className="hover:text-primary transition-colors">Evaluación</Link>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="font-bold text-text-main">Ubicación</h4>
            <div className="flex flex-col gap-2 text-sm text-text-secondary text-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">location_on</span>
                <span>Providencia 1234, Santiago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

const AppRoutes: React.FC = () => (
  <Router>
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/confirmation" element={<Confirmation />} />
        </Routes>
      </main>
      <Footer />
    </div>
  </Router>
);

const App: React.FC = () => (
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
);

export default App;
