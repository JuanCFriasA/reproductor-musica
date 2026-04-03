import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignUp } from '@clerk/clerk-react';
import { AuthLayout } from './AuthLayout';
import { Eye, EyeOff, Loader2, Mail, Lock, User as UserIcon, CheckCircle2 } from 'lucide-react';

export function RegisterView() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const translateError = (msg: string) => {
    if (msg.includes('data breach')) return 'Esta contraseña ha sido expuesta en una filtración de datos. Por seguridad, usa una diferente.';
    if (msg.includes('too short')) return 'La contraseña es demasiado corta.';
    if (msg.includes('Enter a valid email')) return 'Introduce un correo electrónico válido.';
    if (msg.includes('already taken')) return 'Este correo o usuario ya está en uso.';
    if (msg.includes('not be found')) return 'No se pudo encontrar tu cuenta.';
    if (msg.includes('Incorrect password')) return 'Contraseña incorrecta.';
    return msg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setError('');
    setLoading(true);
    try {
      await signUp.create({
        username,
        emailAddress: email,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      setError(translateError(err.errors ? err.errors[0].message : err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setError('');
    setLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        navigate('/');
      } else {
        console.error(completeSignUp);
      }
    } catch (err: any) {
      setError(translateError(err.errors ? err.errors[0].message : err.message));
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <AuthLayout 
        title="Verifica tu cuenta" 
        subtitle="Enviamos un código a tu correo."
        type="register"
      >
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="relative group">
            <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/40 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              value={code} 
              onChange={e => setCode(e.target.value)} 
              placeholder="Código de verificación" 
              required
              className="w-full bg-surface-high/60 border border-white/10 rounded-2xl px-12 py-4 text-sm text-on-surface placeholder:text-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
            />
          </div>
          {error && <div className="text-red-400 text-xs font-bold uppercase">{error}</div>}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-primary text-background font-black uppercase text-xs tracking-widest rounded-full hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Verificar Código
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Crea tu cuenta" 
      subtitle="Únete a la tripulación sonora más exclusiva."
      type="register"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div className="relative group">
            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/40 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="Nombre de usuario" 
              required
              className="w-full bg-surface-high/60 border border-white/10 rounded-2xl px-12 py-2.5 text-xs text-on-surface placeholder:text-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
            />
          </div>

          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/40 group-focus-within:text-primary transition-colors" />
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="correo@ejemplo.com" 
              required
              className="w-full bg-surface-high/60 border border-white/10 rounded-2xl px-12 py-2.5 text-xs text-on-surface placeholder:text-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
            />
          </div>
          
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/40 group-focus-within:text-primary transition-colors" />
            <input 
              type={showPwd ? 'text' : 'password'} 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••" 
              required 
              minLength={6}
              className="w-full bg-surface-high/60 border border-white/10 rounded-2xl px-12 py-2.5 text-xs text-on-surface placeholder:text-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
            />
            <button 
              type="button" 
              onClick={() => setShowPwd(p => !p)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-primary transition-colors"
            >
              {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-2xl font-bold uppercase">
            {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading || !isLoaded}
          className="w-full py-3 bg-primary text-background font-black uppercase text-[10px] tracking-[0.2em] rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-primary/10"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Crear cuenta ahora
        </button>


        <p className="text-[10px] text-secondary/30 text-center px-4 leading-relaxed font-bold uppercase tracking-widest mt-2">
          Al registrarte, aceptas nuestros <span className="text-secondary/60 underline cursor-pointer">Términos</span> y <span className="text-secondary/60 underline cursor-pointer">Política de Privacidad</span>.
        </p>
      </form>
    </AuthLayout>
  );
}
