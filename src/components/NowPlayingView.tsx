import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlayer } from '../PlayerContext';
// Añadimos Radio a los iconos
import { ChevronDown, Heart, ListPlus, Share2, Music2, Loader2, ExternalLink, Radio } from 'lucide-react';
import { getLyrics } from '../lib/searchServices';
import { cn } from '../lib/utils';

interface NowPlayingViewProps {
  onClose: () => void;
}

export function NowPlayingView({ onClose }: NowPlayingViewProps) {
  const { currentTrack } = usePlayer();
  const [lyrics, setLyrics] = React.useState<string[] | null>(null);
  const [loadingLyrics, setLoadingLyrics] = React.useState(false);

  React.useEffect(() => {
    // Si es radio, no buscamos letras
    if (currentTrack.isRadio) {
      setLyrics(null);
      return;
    }

    const fetchLyrics = async () => {
      setLoadingLyrics(true);
      const res = await getLyrics(currentTrack.artist, currentTrack.title);
      setLyrics(res);
      setLoadingLyrics(false);
    };
    fetchLyrics();
  }, [currentTrack.id, currentTrack.isRadio]);

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[60] bg-background flex flex-col md:flex-row"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[150px]" />
      </div>

      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-8 left-8 z-50 w-12 h-12 bg-surface-high/50 backdrop-blur-xl rounded-full flex items-center justify-center text-on-surface hover:scale-110 transition-transform"
      >
        <ChevronDown className="w-6 h-6" />
      </button>

      {/* Left Column: Album Art */}
      <div className="w-full md:w-1/2 h-[50vh] md:h-full flex items-center justify-center p-8 md:p-16">
        <div className="relative group w-full max-w-lg aspect-square">
          <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-50 group-hover:opacity-80 transition-opacity" />
          <motion.img 
            layoutId={`cover-${currentTrack.id}`}
            src={currentTrack.cover} 
            alt={currentTrack.title} 
            className="relative z-10 w-full h-full object-cover rounded-3xl shadow-2xl border border-white/5"
            referrerPolicy="no-referrer"
          />
          
          <div className="absolute bottom-8 left-8 right-8 z-20 flex items-end gap-1.5 h-16 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div 
                key={i}
                animate={{ height: [10, Math.random() * 60 + 10, 10] }}
                transition={{ duration: 0.5 + Math.random(), repeat: Infinity }}
                className="flex-1 bg-primary/60 rounded-t-full"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Info & Lyrics */}
      <div className="w-full md:w-1/2 h-[50vh] md:h-full flex flex-col justify-center p-8 md:p-16 space-y-12 overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="font-headline text-xs uppercase tracking-[0.3em] text-primary font-bold">
              {currentTrack.isRadio ? 'Escuchando' : 'Reproduciendo ahora'}
            </span>
            
            {/* INDICADOR EN VIVO */}
            {currentTrack.isRadio && (
              <motion.span 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-full"
              >
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-tighter text-red-500">En Vivo</span>
              </motion.span>
            )}
          </div>

          <h1 className="font-headline text-5xl md:text-7xl font-extrabold italic tracking-tighter text-on-surface leading-none">
            {currentTrack.title}
          </h1>
          <div className="flex items-center gap-4">
            <h2 className="text-2xl text-primary font-light">{currentTrack.artist}</h2>
            <div className="w-1.5 h-1.5 rounded-full bg-surface-high" />
            <h3 className="text-2xl text-on-surface-variant font-light">{currentTrack.album}</h3>
          </div>
        </div>

        {/* Lyrics / Radio Placeholder */}
        <div className="bg-surface-low/40 rounded-[2.5rem] p-10 h-96 overflow-y-auto no-scrollbar border border-white/5 backdrop-blur-md">
          {currentTrack.isRadio ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <Radio className="w-16 h-16 text-primary animate-pulse" />
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-primary/20 rounded-full blur-xl" 
                />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-headline font-bold text-on-surface">Transmisión Digital Directa</p>
                <p className="text-sm text-on-surface-variant max-w-xs">Estás conectado a la señal en vivo. Las letras no están disponibles para transmisiones de radio.</p>
              </div>
            </div>
          ) : loadingLyrics ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 animate-pulse">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-secondary font-headline uppercase tracking-widest text-[10px]">Buscando versos en la red...</p>
            </div>
          ) : lyrics ? (
            <div className="space-y-8">
              {lyrics.map((line, i) => (
                <p 
                  key={i}
                  className="text-on-surface-variant text-xl font-light hover:opacity-100 hover:text-white transition-all cursor-default"
                >
                  {line}
                </p>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-on-surface-variant opacity-40 space-y-4">
              <Music2 className="w-12 h-12" />
              <p className="text-sm font-bold uppercase tracking-widest">No hay letras disponibles</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex gap-8">
            <button className="text-primary hover:scale-110 transition-transform">
              <Heart className="w-6 h-6 fill-current" />
            </button>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <ListPlus className="w-6 h-6" />
            </button>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <Share2 className="w-6 h-6" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-0.5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={cn("w-1 h-3 rounded-full animate-pulse", currentTrack.isRadio ? "bg-red-500" : "bg-primary")} />
              ))}
            </div>
            <span className={cn("font-headline text-xs uppercase tracking-widest font-bold", currentTrack.isRadio ? "text-red-500" : "text-primary")}>
              {currentTrack.isRadio ? 'Live Stream' : 'Audio HD'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}