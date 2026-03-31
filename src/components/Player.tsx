/**
 * src/components/Player.tsx
 * Fixes:
 *  – Volume slider is interactive (onChange wired up)
 *  – Seek bar is clickable (calculates ratio from click position)
 *  – Shuffle & Repeat buttons visible with active state
 *  – Like button in player bar
 *  – Mute toggle on volume icon click
 */

import React, { useRef } from 'react';
import { usePlayer } from '../PlayerContext';
import {
  Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Volume2, VolumeX,
  Heart, Radio,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface PlayerProps {
  onExpand?: () => void;
}

export function Player({ onExpand }: PlayerProps) {
  const {
    currentTrack, isPlaying, progress,
    currentTime, duration, volume,
    isShuffle, isRepeat,
    togglePlay, nextTrack, prevTrack, seek,
    setVolume, toggleShuffle, toggleRepeat,
    toggleLike, isLiked,
  } = usePlayer();

  const progressRef = useRef<HTMLDivElement>(null);
  const prevVol     = useRef(0.7);

  // ── Helpers ────────────────────────────────
  const fmt = (t: number) => {
    if (!t || !isFinite(t) || currentTrack.isRadio) return '--:--';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (currentTrack.isRadio || !duration) return;
    const rect  = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(ratio * duration);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    prevVol.current = v > 0 ? v : prevVol.current;
    setVolume(v);
  };

  const toggleMute = () => {
    if (volume > 0) { prevVol.current = volume; setVolume(0); }
    else             setVolume(prevVol.current || 0.7);
  };

  return (
    <footer className="fixed bottom-0 w-full h-24 z-50 bg-background/95 backdrop-blur-2xl border-t border-secondary/10 shadow-2xl flex items-center px-6 md:px-12 gap-4 md:gap-8">

      {/* ── Track Info ─────────────────────── */}
      <div className="flex items-center gap-3 w-1/3 min-w-0">
        <div
          className="relative group cursor-pointer flex-shrink-0"
          onClick={onExpand}
        >
          <img
            src={currentTrack.cover}
            alt="cover"
            className="w-14 h-14 rounded-xl object-cover shadow-lg group-hover:opacity-75 transition-opacity"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4
              onClick={onExpand}
              className="font-bold text-sm text-on-surface truncate cursor-pointer hover:underline"
            >
              {currentTrack.title}
            </h4>
            {currentTrack.isRadio && (
              <span className="hidden sm:flex items-center gap-1 text-[8px] font-black uppercase bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full border border-red-500/30 animate-pulse flex-shrink-0">
                <span className="w-1 h-1 bg-red-500 rounded-full" />
                En Vivo
              </span>
            )}
          </div>
          <p className="text-xs text-secondary/60 truncate">{currentTrack.artist}</p>
        </div>

        {/* Like button */}
        <button
          onClick={() => toggleLike(currentTrack)}
          className="hidden sm:flex flex-shrink-0 p-1 hover:scale-110 transition-transform text-primary"
          title={isLiked(currentTrack.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <Heart className={cn('w-4 h-4', isLiked(currentTrack.id) && 'fill-current')} />
        </button>
      </div>

      {/* ── Controls & Progress ────────────── */}
      <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl">

        {/* Buttons */}
        <div className="flex items-center gap-4 md:gap-6">
          <button
            onClick={toggleShuffle}
            title="Aleatorio"
            className={cn(
              'hidden sm:block transition-colors',
              isShuffle ? 'text-primary' : 'text-secondary/50 hover:text-primary',
            )}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={prevTrack}
            className="text-secondary/60 hover:text-primary transition-colors"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-primary text-background flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-primary/20"
          >
            {isPlaying
              ? <Pause className="w-5 h-5 fill-current" />
              : <Play  className="w-5 h-5 fill-current ml-0.5" />
            }
          </button>

          <button
            onClick={nextTrack}
            className="text-secondary/60 hover:text-primary transition-colors"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={toggleRepeat}
            title="Repetir"
            className={cn(
              'hidden sm:block transition-colors',
              isRepeat ? 'text-primary' : 'text-secondary/50 hover:text-primary',
            )}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Seek bar */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[10px] text-secondary/40 font-mono w-8 text-right tabular-nums">
            {fmt(currentTime)}
          </span>

          <div
            ref={progressRef}
            onClick={handleSeekClick}
            className={cn(
              'flex-1 h-1.5 bg-surface-high rounded-full relative group overflow-visible',
              !currentTrack.isRadio && 'cursor-pointer',
            )}
          >
            {/* Fill */}
            <div
              className={cn(
                'absolute top-0 left-0 h-full rounded-full transition-[width] duration-300',
                currentTrack.isRadio ? 'bg-red-500 w-full' : 'bg-primary',
              )}
              style={{ width: currentTrack.isRadio ? '100%' : `${progress}%` }}
            />
            {/* Thumb (hover) */}
            {!currentTrack.isRadio && (
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow pointer-events-none"
                style={{ left: `calc(${progress}% - 6px)` }}
              />
            )}
          </div>

          <span className="text-[10px] text-secondary/40 font-mono w-8 tabular-nums">
            {fmt(duration)}
          </span>
        </div>
      </div>

      {/* ── Volume & Expand ────────────────── */}
      <div className="hidden md:flex items-center justify-end gap-4 w-1/3">
        {/* Expand / Now-Playing */}
        <button
          onClick={onExpand}
          className="p-2 hover:bg-white/5 rounded-full transition-colors"
          title="Ver reproducción"
        >
          <Radio className={cn('w-4 h-4', currentTrack.isRadio ? 'text-red-500' : 'text-secondary/50')} />
        </button>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <button onClick={toggleMute} className="text-secondary/60 hover:text-primary transition-colors flex-shrink-0">
            {volume === 0
              ? <VolumeX className="w-4 h-4" />
              : <Volume2 className="w-4 h-4" />
            }
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 h-1 cursor-pointer accent-primary"
            style={{
              background: `linear-gradient(to right,
                var(--color-primary) ${volume * 100}%,
                rgba(255,255,255,0.1) ${volume * 100}%)`,
            }}
          />
        </div>
      </div>
    </footer>
  );
}