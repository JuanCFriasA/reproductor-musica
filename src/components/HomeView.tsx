import React from 'react';
import { motion } from 'motion/react';
import { Play, ChevronLeft, ChevronRight, MoreVertical, Music2 } from 'lucide-react';
import { TRACKS } from '../types';
import { usePlayer } from '../PlayerContext';
import { cn } from '../lib/utils';

export function HomeView() {
  const { playTrack } = usePlayer();

  return (
    <div className="space-y-16">
      {/* Editorial Hero */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-surface-low h-[450px] flex items-center group">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/midnight/1600/900')] bg-cover bg-center opacity-30 mix-blend-overlay group-hover:scale-105 transition-transform duration-1000" />
        <div className="relative z-10 px-12 md:w-2/3">
          <span className="bg-primary/20 text-primary px-3 py-1 rounded-full uppercase tracking-widest font-bold text-[10px] mb-6 inline-block">Novedad Editorial</span>
          <h2 className="text-5xl md:text-7xl font-extrabold font-headline leading-none text-white mb-6 drop-shadow-2xl">
            Ecos de <br /><span className="text-primary italic">Medianoche</span>
          </h2>
          <p className="text-on-surface-variant text-lg max-w-md mb-8 font-light leading-relaxed">
            Una selección curada de Jazz contemporáneo y Soul electrónico para los momentos de introspección profunda.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => playTrack(TRACKS[0])}
              className="px-10 py-4 bg-primary text-background font-bold rounded-full flex items-center gap-3 hover:scale-105 transition-transform shadow-xl shadow-primary/20"
            >
              <Play className="w-5 h-5 fill-current" />
              Reproducir
            </button>
            <button className="px-10 py-4 border border-white/10 text-white font-bold rounded-full hover:bg-white/5 transition-colors backdrop-blur-sm">
              Guardar
            </button>
          </div>
        </div>
      </section>

      {/* Daily Mixes */}
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="text-2xl font-bold font-headline">Misas Automáticas</h3>
            <p className="text-sm text-on-surface-variant">Generadas por tu frecuencia musical</p>
          </div>
          <button className="text-primary text-sm font-bold hover:underline">Ver todo</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -8 }}
              className="group cursor-pointer"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-surface-high shadow-lg">
                <img 
                  src={`https://picsum.photos/seed/mix${i}/600/600`} 
                  alt={`Mix ${i}`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-background shadow-2xl">
                    <Play className="w-6 h-6 fill-current ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4">
                  <p className="text-[10px] font-bold text-white uppercase tracking-tighter">Mix Diario {i}</p>
                </div>
              </div>
              <h4 className="font-headline font-bold truncate">Frecuencia {i}</h4>
              <p className="text-xs text-on-surface-variant line-clamp-1">Varios Artistas</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recommendations & Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <h3 className="text-2xl font-bold font-headline">Recomendaciones del Editor</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TRACKS.map((track) => (
              <div 
                key={track.id}
                onClick={() => playTrack(track)}
                className="flex items-center gap-4 p-4 bg-surface-low/50 rounded-2xl hover:bg-surface-high transition-all group cursor-pointer border border-white/5"
              >
                <img 
                  src={track.cover} 
                  alt={track.title} 
                  className="w-20 h-20 rounded-xl object-cover shadow-lg"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold truncate">{track.title}</h5>
                  <p className="text-xs text-on-surface-variant">{track.artist}</p>
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity w-10 h-10 bg-primary rounded-full flex items-center justify-center text-background shadow-lg">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-low/50 p-8 rounded-[2.5rem] border border-white/5">
          <h3 className="text-2xl font-bold font-headline mb-8">Top Música</h3>
          <div className="space-y-6">
            {TRACKS.map((track, i) => (
              <div key={track.id} className="flex items-center gap-4 group cursor-pointer">
                <span className={cn(
                  "text-2xl font-black w-8",
                  i === 0 ? "text-primary" : "text-secondary/20"
                )}>
                  0{i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <h6 className="font-bold truncate group-hover:text-primary transition-colors">{track.title}</h6>
                  <p className="text-xs text-on-surface-variant">{track.artist}</p>
                </div>
                <span className="text-xs text-on-surface-variant font-mono">3:45</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-10 py-3 border border-white/10 rounded-full text-xs font-bold hover:bg-white/5 transition-colors uppercase tracking-widest">
            Explorar Rankings
          </button>
        </div>
      </div>
    </div>
  );
}
