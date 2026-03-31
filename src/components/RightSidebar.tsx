/**
 * src/components/RightSidebar.tsx
 * "Lo que sigue" now shows the real playback queue.
 * When the queue is empty it falls back to the next static tracks.
 * Queue items can be removed with the × button.
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, X, Users, ListMusic } from 'lucide-react';
import { TRACKS } from '../types';
import { cn } from '../lib/utils';
import { usePlayer } from '../PlayerContext';

export function RightSidebar() {
  const { playTrack, currentTrack, queue, removeFromQueue, addToQueue } = usePlayer();

  // What to display: real queue or fallback to next static tracks
  const isRealQueue = queue.length > 0;
  const displayList = isRealQueue
    ? queue.slice(0, 8)
    : TRACKS.filter(t => t.id !== currentTrack.id).slice(0, 4);

  return (
    <aside className="hidden lg:flex h-screen w-80 fixed right-0 top-0 bg-background border-l border-white/5 flex-col pt-8 pb-28 z-40">
      <div className="px-6 pt-10 flex flex-col h-full overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-headline font-bold text-lg">Actividad</h3>
          <Users className="w-5 h-5 text-secondary/40" />
        </div>

        {/* Queue section */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h3 className="font-headline font-bold text-base flex items-center gap-2">
              <ListMusic className="w-4 h-4 text-primary" />
              Lo que sigue
            </h3>
            {isRealQueue && (
              <span className="text-[10px] uppercase tracking-widest text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">
                {queue.length} en cola
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
            <AnimatePresence initial={false}>
              {displayList.map((track, i) => (
                <motion.div
                  key={track.id + i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-xl transition-all group border',
                    currentTrack.id === track.id
                      ? 'bg-primary/10 border-primary/20'
                      : 'hover:bg-white/5 border-transparent',
                  )}
                >
                  {/* Cover */}
                  <div
                    className="relative w-11 h-11 flex-shrink-0 cursor-pointer"
                    onClick={() => playTrack(track)}
                  >
                    <img
                      src={track.cover}
                      alt={track.title}
                      className="w-full h-full rounded-lg object-cover shadow"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                      <Play className="w-4 h-4 text-primary fill-current" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => playTrack(track)}>
                    <h4 className="text-xs font-bold truncate group-hover:text-primary transition-colors">
                      {track.title}
                    </h4>
                    <p className="text-[10px] text-on-surface-variant truncate">{track.artist}</p>
                  </div>

                  {/* Action */}
                  {isRealQueue ? (
                    <button
                      onClick={() => removeFromQueue(i)}
                      className="flex-shrink-0 text-secondary/20 hover:text-red-400 transition-colors"
                      title="Quitar de la cola"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => addToQueue(track)}
                      className="flex-shrink-0 text-secondary/20 hover:text-primary transition-colors text-[10px] font-bold uppercase"
                      title="Añadir a la cola"
                    >
                      +
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {displayList.length === 0 && (
              <div className="text-center py-10 text-on-surface-variant/30">
                <ListMusic className="w-8 h-8 mx-auto mb-2" />
                <p className="text-xs">Cola vacía</p>
              </div>
            )}
          </div>
        </div>

        {/* Podcast promo */}
        <div className="mt-4 pt-4 border-t border-white/5 flex-shrink-0">
          <div className="bg-gradient-to-br from-primary/20 to-secondary/10 p-5 rounded-3xl border border-white/10 relative overflow-hidden group cursor-pointer">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-primary/20 transition-colors" />
            <h4 className="text-sm font-bold mb-1.5 relative z-10">Explora Podcasts</h4>
            <p className="text-[10px] text-on-surface-variant mb-3 relative z-10 line-clamp-2">
              Nuevas historias y debates sobre curaduría musical.
            </p>
            <button className="text-[10px] font-bold text-primary uppercase tracking-widest relative z-10 hover:underline">
              Escuchar ahora
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}