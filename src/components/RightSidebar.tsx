import React from 'react';
import { motion } from 'motion/react';
import { User, Users, Activity, Play, MoreHorizontal } from 'lucide-react';
import { TRACKS } from '../types';
import { cn } from '../lib/utils';
import { usePlayer } from '../PlayerContext';

export function RightSidebar() {
  const { playTrack, currentTrack } = usePlayer();

  const activity = [
   
  ];

  return (
    <aside className="hidden lg:flex h-screen w-80 fixed right-0 top-0 bg-background border-l border-white/5 flex-col pt-8 pb-28 z-40">
      <div className="px-6 pt-10">
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-headline font-bold text-lg">Actividad</h3>
          <Users className="w-5 h-5 text-secondary/40" />
        </div>

        <div className="space-y-6">
          {activity.map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-4 group cursor-pointer"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-surface-high overflow-hidden border border-white/10">
                  <img src={`https://picsum.photos/seed/user${i}/100/100`} alt={item.user} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                  <Activity className="w-2 h-2 text-background" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-on-surface truncate">
                  {item.user} <span className="font-normal text-on-surface-variant">{item.action}</span>
                </p>
                <p className="text-[10px] text-primary font-bold truncate mt-0.5">{item.track.title}</p>
                <p className="text-[9px] text-on-surface-variant/40 uppercase tracking-widest mt-1">{item.time}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline font-bold text-lg">Lo que sigue</h3>
            <button className="text-[10px] uppercase tracking-widest text-primary font-bold">Ver cola</button>
          </div>
          
          <div className="space-y-4">
            {TRACKS.slice(0, 3).map((track, i) => (
              <div 
                key={track.id}
                onClick={() => playTrack(track)}
                className={cn(
                  "flex items-center gap-4 p-2 rounded-xl transition-all group cursor-pointer",
                  currentTrack.id === track.id ? "bg-primary/10 border border-primary/20" : "hover:bg-white/5 border border-transparent"
                )}
              >
                <div className="relative w-12 h-12 flex-shrink-0">
                  <img src={track.cover} alt={track.title} className="w-full h-full rounded-lg object-cover shadow-lg" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <Play className="w-4 h-4 text-primary fill-current" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold truncate group-hover:text-primary transition-colors">{track.title}</h4>
                  <p className="text-[10px] text-on-surface-variant truncate">{track.artist}</p>
                </div>
                <button className="text-secondary/20 hover:text-primary transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-8">
          <div className="bg-gradient-to-br from-primary/20 to-secondary/10 p-6 rounded-3xl border border-white/10 relative overflow-hidden group cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-colors" />
            <h4 className="text-sm font-bold mb-2 relative z-10">Explora Podcasts</h4>
            <p className="text-[10px] text-on-surface-variant mb-4 relative z-10 line-clamp-2">Nuevas historias y debates sobre la curaduría musical.</p>
            <button className="text-[10px] font-bold text-primary uppercase tracking-widest relative z-10 hover:underline">Escuchar ahora</button>
          </div>
        </div>
      </div>
    </aside>
  );
}
