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
  Maximize2,
  Heart
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
    isShuffle,
    isRepeat,
    togglePlay, 
    nextTrack, 
    prevTrack, 
    seek, 
    setVolume,
    toggleShuffle,
    toggleRepeat
  } = usePlayer();

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <footer className="fixed bottom-0 w-full h-24 z-50 bg-background/95 backdrop-blur-2xl border-t border-secondary/10 shadow-2xl flex items-center px-6 md:px-12">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        {/* Track Info */}
        <div className="flex items-center gap-4 w-1/3 min-w-0">
          <div 
            className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer group relative"
            onClick={onExpand}
          >
            <img 
              src={currentTrack.cover} 
              alt={currentTrack.title} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-on-surface truncate">{currentTrack.title}</h4>
            <p className="text-xs text-on-surface-variant truncate">{currentTrack.artist}</p>
          </div>
          <button className="text-secondary/60 hover:text-primary transition-colors">
            <Heart className="w-4 h-4" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-xl px-4">
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleShuffle}
              className={cn(
                "transition-colors",
                isShuffle ? "text-primary" : "text-secondary/60 hover:text-on-surface"
              )}
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button 
              onClick={prevTrack}
              className="text-secondary/60 hover:text-on-surface transition-colors"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            <button 
              onClick={togglePlay}
              className="w-10 h-10 bg-on-surface text-background rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
            <button 
              onClick={nextTrack}
              className="text-secondary/60 hover:text-on-surface transition-colors"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
            <button 
              onClick={toggleRepeat}
              className={cn(
                "transition-colors",
                isRepeat ? "text-primary" : "text-secondary/60 hover:text-on-surface"
              )}
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          <div className="w-full flex items-center gap-3">
            <span className="text-[10px] text-on-surface-variant font-mono w-8 text-right">
              {formatTime(currentTime)}
            </span>
            <div 
              className="flex-1 h-1 bg-surface-high rounded-full relative group cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const pct = x / rect.width;
                seek(pct * duration);
              }}
            >
              <div 
                className="absolute top-0 left-0 h-full bg-primary rounded-full" 
                style={{ width: `${progress}%` }}
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-on-surface rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                style={{ left: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] text-on-surface-variant font-mono w-8">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume & Utilities */}
        <div className="hidden md:flex items-center justify-end gap-6 w-1/3">
          <button className="text-secondary/60 hover:text-on-surface transition-colors">
            <ListMusic className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 w-32 group">
            <Volume2 className="w-4 h-4 text-secondary/60 group-hover:text-on-surface transition-colors" />
            <div 
              className="flex-1 h-1 bg-surface-high rounded-full relative cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const pct = Math.max(0, Math.min(1, x / rect.width));
                setVolume(pct);
              }}
            >
              <div 
                className="absolute top-0 left-0 h-full bg-secondary/60 group-hover:bg-primary transition-colors rounded-full" 
                style={{ width: `${volume * 100}%` }}
              />
            </div>
          </div>
          <button 
            onClick={onExpand}
            className="text-secondary/60 hover:text-on-surface transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}
