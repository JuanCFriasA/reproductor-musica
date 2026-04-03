import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';
import { AuthLayout } from './AuthLayout';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';

export function LoginView() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const navigate = useNavigate();
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
    if (msg.includes('could not be found')) return 'No se pudo encontrar tu cuenta.';
    if (msg.includes('Incorrect password')) return 'Contraseña incorrecta.';
    if (msg.includes('is required')) return 'Este campo es obligatorio.';
    return msg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setError('');
    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate('/');
      } else {
        console.log('SignIn status:', result.status);
        
        // Handle cases where more verification is needed
        if (result.status === 'needs_first_factor') {
          const factor = result.supportedFirstFactors.find(f => f.strategy === 'email_code') as any;
          if (factor) {
            await signIn.prepareFirstFactor({ 
              strategy: 'email_code',
              emailAddressId: factor.emailAddressId 
            });
            setPendingVerification(true);
          } else {
            setError("Se requiere un código de verificación, pero no se encontró un método compatible.");
          }
        } else if (result.status === 'needs_second_factor') {
          setPendingVerification(true);
        } else {
          setError("Se requiere verificación adicional. Por favor, revisa tu correo.");
        }
      }
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
      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate('/');
      } else {
        console.error(result);
        setError("La verificación falló. Reintenta.");
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
        title="Verificación requerida" 
        subtitle="Introduce el código que enviamos a tu correo."
        type="login"
      >
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/40 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              value={code} 
              onChange={e => setCode(e.target.value)} 
              placeholder="Código de verificación" 
              required
              className="w-full bg-surface-high/60 border border-white/10 rounded-2xl px-12 py-2.5 text-xs text-on-surface placeholder:text-secondary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium" 
            />
          </div>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] px-4 py-3 rounded-2xl font-bold uppercase tracking-tight">
              {error}
            </div>
          )}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-primary text-background font-black uppercase text-[10px] tracking-[0.2em] rounded-full hover:scale-[1.02] transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Verificar Código
          </button>

          <div className="flex flex-col items-center gap-2 pt-2">
            <button 
              type="button"
              onClick={async () => {
                setError('');
                setLoading(true);
                try {
                  const factor = signIn.supportedFirstFactors.find(f => f.strategy === 'email_code') as any;
                  if (factor) {
                    await signIn.prepareFirstFactor({ 
                      strategy: 'email_code',
                      emailAddressId: factor.emailAddressId 
                    });
                    setError("Código reenviado. Revisa tu correo.");
                  } else {
                    setError("No se pudo reenviar el código.");
                  }
                } catch (err: any) {
                  setError(err.message);
                } finally {
                  setLoading(false);
                }
              }}
              className="text-[10px] text-primary font-bold hover:underline uppercase tracking-widest"
            >
              ¿No recibiste el código? Reenviar
            </button>

            <button 
              type="button" 
              onClick={() => setPendingVerification(false)}
              className="text-[10px] text-secondary/40 font-bold hover:text-primary transition-colors uppercase tracking-widest"
            >
              Volver al login
            </button>
          </div>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Bienvenido de nuevo" 
      subtitle="Inicia sesión para continuar tu viaje musical."
      type="login"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
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
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] px-4 py-3 rounded-2xl font-bold uppercase tracking-tight">
            {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading || !isLoaded}
          className="w-full py-3 bg-primary text-background font-black uppercase text-[10px] tracking-[0.2em] rounded-full hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-primary/10"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Acceder ahora
        </button>


        <div className="flex items-center justify-center pt-2">
          <button type="button" className="text-xs text-secondary/40 font-bold hover:text-primary transition-colors uppercase tracking-widest">
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
