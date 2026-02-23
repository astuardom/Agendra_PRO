
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Correctly using signInWithEmailAndPassword with auth instance
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Login error:", err.code, err.message);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-email' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Correo o contraseña incorrectos.');
      } else {
        setError('Ocurrió un error al intentar ingresar. Revisa tu conexión.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-alt flex items-center justify-center p-4 sm:p-6 text-text-main">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-12">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-4xl">lock_person</span>
          </div>
          <h1 className="text-2xl font-black">Acceso Administrativo</h1>
          <p className="text-text-secondary text-sm text-center">Inicia sesión para gestionar la agenda.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold border border-red-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Correo Electrónico</label>
            <input 
              type="email" 
              required 
              className="w-full rounded-xl border-slate-200 py-3 px-4 focus:ring-primary focus:border-primary"
              placeholder="admin@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Contraseña</label>
            <input 
              type="password" 
              required 
              className="w-full rounded-xl border-slate-200 py-3 px-4 focus:ring-primary focus:border-primary"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Validando...' : 'Ingresar'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-slate-400 font-bold hover:text-primary transition-colors">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
