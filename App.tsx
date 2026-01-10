
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { auth } from './firebase';
import Home from './pages/Home';
import About from './pages/About';
import Booking from './pages/Booking';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import Confirmation from './pages/Confirmation';
import Login from './pages/Login';

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const isDashboard = location.pathname.startsWith('/dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  if (isDashboard || location.pathname === '/login') return null;

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f2f4] bg-white/80 backdrop-blur-md px-6 md:px-20 py-4">
      <Link to="/" className="flex items-center gap-4 text-primary">
        <span className="material-symbols-outlined text-3xl filled-icon">psychology</span>
        <h2 className="text-text-main text-xl font-extrabold leading-tight tracking-[-0.015em]">Ps. Alejandro Martínez</h2>
      </Link>
      <div className="flex flex-1 justify-end gap-8">
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          <Link to="/" className={`text-sm font-semibold transition-colors ${location.pathname === '/' ? 'text-primary' : 'text-text-main hover:text-primary'}`}>Inicio</Link>
          <Link to="/about" className={`text-sm font-semibold transition-colors ${location.pathname === '/about' ? 'text-primary' : 'text-text-main hover:text-primary'}`}>Mi Enfoque</Link>
          <Link to="/booking" className={`text-sm font-bold px-5 py-2.5 rounded-full transition-all flex items-center gap-2 ${location.pathname === '/booking' ? 'bg-primary text-white shadow-lg scale-105' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'}`}>
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            Agendar Sesión
          </Link>
          <Link to="/contact" className={`text-sm font-semibold transition-colors ${location.pathname === '/contact' ? 'text-primary' : 'text-text-main hover:text-primary'}`}>Contacto</Link>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/dashboard" className="hidden sm:flex items-center justify-center rounded-lg h-10 px-4 bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 text-sm font-bold">
                Panel Admin
              </Link>
              <button onClick={handleLogout} className="flex cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-slate-900 hover:bg-black transition-colors text-white text-sm font-bold shadow-sm">
                Salir
              </button>
            </>
          ) : (
            <Link to="/login" className="flex min-w-[100px] cursor-pointer items-center justify-center rounded-lg h-10 px-6 bg-slate-900 hover:bg-black transition-colors text-white text-sm font-bold shadow-sm">
              Ingresar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

const Footer: React.FC = () => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname === '/login';

  if (isDashboard) return null;

  return (
    <footer className="border-t border-gray-100 bg-white pt-16 pb-8 px-6 md:px-20 flex justify-center">
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

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center"><span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span></div>;

  return user ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navigation />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/confirmation" element={<Confirmation />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
