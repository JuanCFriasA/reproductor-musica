import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  type: 'login' | 'register';
}

export function AuthLayout({ children, title, subtitle, type }: AuthLayoutProps) {
  const isRegister = type === 'register';

  return (
    <div className={`fixed inset-0 z-[100] flex bg-background overflow-hidden ${isRegister ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
      
      {/* Visual Side */}
      <motion.div 
        layoutId="auth-visual"
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden"
      >
        <div 
          className="absolute inset-0 bg-cover bg-center z-0 transition-transform duration-10000 hover:scale-110"
          style={{ backgroundImage: 'url("/auth_bg.png")' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/40 to-primary/20 z-10" />
        
        <div className="relative z-20 max-w-md">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl font-black font-headline uppercase leading-none tracking-tighter text-on-surface mb-6"
          >
            Siente el ritmo de <span className="text-primary italic">la noche.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-secondary/80 text-lg font-medium leading-relaxed"
          >
            Accede a tu colección exclusiva de curaduría nocturna, estaciones en vivo y la mejor atmósfera sonora.
          </motion.p>
        </div>

        <div className="relative z-20 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] font-bold text-secondary/40">
          <span>&copy; 2026 Midnight Cruise</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary transition-colors">Términos</a>
            <a href="#" className="hover:text-primary transition-colors">Privacidad</a>
          </div>
        </div>
      </motion.div>

      {/* Form Side */}
      <motion.div 
        layoutId="auth-form-container"
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 md:p-8 relative bg-surface-low"
      >
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[320px] my-auto"
        >
          <div className="mb-4 text-center lg:text-left">
            <h3 className="text-xl font-headline font-black uppercase tracking-tight mb-0.5">{title}</h3>
            <p className="text-secondary/60 text-[10px] font-bold uppercase tracking-widest leading-none">
              {subtitle}
            </p>
          </div>

          <div className="space-y-3">
            {children}
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex flex-col items-center gap-2">
            <p className="text-[10px] uppercase font-bold text-secondary/30 tracking-widest">
              {type === 'login' ? '¿Aún no tienes una cuenta?' : '¿Ya eres parte de la tripulación?'}
            </p>
            <Link 
              to={type === 'login' ? '/register' : '/login'}
              className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all w-full text-center"
            >
              {type === 'login' ? 'Crear mi cuenta' : 'Entrar a mi cuenta'}
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
