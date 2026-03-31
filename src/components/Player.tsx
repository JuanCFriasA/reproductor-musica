// Player.tsx
import React from 'react';
import { usePlayer } from '../PlayerContext';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Volume2, 
  ListMusic, 
  Heart,
  Radio // <-- Importa el icono de Radio
} from 'lucide-react';
import { cn } from '../lib/utils';

interface PlayerProps {
  onExpand?: () => void;
}

export function Player({ onExpand }: PlayerProps) {
  const { 
    currentTrack, 
    isPlaying, 
    progress, 
    currentTime, 
    duration, 
    volume,
    setVolume,
    togglePlay, 
    nextTrack, 
    prevTrack, 
  } = usePlayer();

  // FIX: Evita el Infinity:NaN
  const formatTime = (time: number) => {
    if (isNaN(time) || time === Infinity || currentTrack.isRadio) return "--:--";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <footer className="fixed bottom-0 w-full h-24 z-50 bg-background/95 backdrop-blur-2xl border-t border-secondary/10 shadow-2xl flex items-center px-6 md:px-12 gap-8">
      
      {/* Track Info */}
      <div className="flex items-center gap-4 w-1/3 min-w-0">
        <div className="relative group cursor-pointer" onClick={onExpand}>
          <img 
            src={currentTrack.cover} 
            alt="cover" 
            className="w-14 h-14 rounded-xl object-cover shadow-lg group-hover:opacity-80 transition-opacity" 
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-on-surface truncate cursor-pointer hover:underline" onClick={onExpand}>
              {currentTrack.title}
            </h4>
            
            {/* INDICADOR EN VIVO (Badge) */}
            {currentTrack.isRadio && (
              <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-tighter bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full border border-red-500/30 animate-pulse">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                En Vivo
              </span>
            )}
          </div>
          <p className="text-xs text-secondary/60 truncate">{currentTrack.artist}</p>
        </div>
      </div>

      {/* Controls & Progress */}
      <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl">
        <div className="flex items-center gap-6">
          <button onClick={prevTrack} className="text-secondary/60 hover:text-primary transition-colors">
            <SkipBack className="w-5 h-5 fill-current" />
          </button>
          <button 
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-primary text-background flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>
          <button onClick={nextTrack} className="text-secondary/60 hover:text-primary transition-colors">
            <SkipForward className="w-5 h-5 fill-current" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[10px] text-secondary/40 font-mono w-8 text-right">
            {formatTime(currentTime)}
          </span>
          <div className="flex-1 h-1.5 bg-surface-high rounded-full relative group cursor-pointer overflow-hidden">
            <div 
              className={cn(
                "absolute top-0 left-0 h-full transition-all duration-300 rounded-full",
                currentTrack.isRadio ? "bg-red-500 w-full" : "bg-primary w-[var(--progress)]"
              )}
              style={{ '--progress': `${progress}%` } as React.CSSProperties}
            />
          </div>
          <span className="text-[10px] text-secondary/40 font-mono w-8">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Volume (Simplified for brevity) */}
      <div className="hidden md:flex items-center justify-end gap-6 w-1/3">
        <div className="flex items-center gap-2 w-24 group">
          <Volume2 className="w-4 h-4 text-secondary/60" />
          <div className="flex-1 h-1 bg-surface-high rounded-full relative overflow-hidden">
             <div className="absolute top-0 left-0 h-full bg-secondary/40" style={{ width: `${volume * 100}%` }} />
          </div>
        </div>
        <button onClick={onExpand} className="p-2 hover:bg-white/5 rounded-full transition-colors text-secondary/60">
           <Radio className={cn("w-5 h-5", currentTrack.isRadio && "text-red-500")} />
        </button>
      </div>
    </footer>
  );
}