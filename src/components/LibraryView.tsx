import React from 'react';
import { motion } from 'motion/react';
import { Play, Plus, Heart, MoreVertical, Music2, Users, Download, Disc } from 'lucide-react';
import { TRACKS } from '../types';
import { usePlayer } from '../PlayerContext';

export function LibraryView() {
  const { playTrack } = usePlayer();

  return (
    <div className="space-y-16">
      {/* Featured Header */}
      <section className="relative overflow-hidden rounded-[2.5rem] aspect-[21/9] md:aspect-[3/1] bg-surface-low group">
        <img 
          src="https://picsum.photos/seed/library/1600/600" 
          alt="Library" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 p-12 w-full flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-6 inline-block">Colección Destacada</span>
            <h1 className="text-4xl md:text-6xl font-extrabold font-headline tracking-tighter mb-4">Mezclas de Medianoche</h1>
            <p className="text-on-surface-variant max-w-lg text-sm md:text-base leading-relaxed">
              Una selección curada de ritmos sintetizados y atmósferas envolventes para tus sesiones de enfoque nocturno.
            </p>
          </div>
          <button 
            onClick={() => playTrack(TRACKS[0])}
            className="bg-primary text-background p-6 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
          >
            <Play className="w-8 h-8 fill-current ml-1" />
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Playlists */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-headline">Tus Listas de Reproducción</h2>
            <button className="text-primary text-sm font-medium hover:underline">Ver todo</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -8 }}
                className="bg-surface-low/50 p-5 rounded-[2rem] hover:bg-surface-high transition-all group cursor-pointer border border-white/5"
              >
                <div className="relative aspect-square mb-5 overflow-hidden rounded-2xl shadow-xl">
                  <img 
                    src={`https://picsum.photos/seed/playlist${i}/600/600`} 
                    alt={`Playlist ${i}`} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-10 h-10 text-white fill-current" />
                  </div>
                </div>
                <h3 className="font-bold truncate">Playlist Nocturna {i}</h3>
                <p className="text-xs text-on-surface-variant">42 canciones</p>
              </motion.div>
            ))}
          </div>

          {/* Recent Albums */}
          <div className="space-y-8 pt-8">
            <h2 className="text-2xl font-bold font-headline">Álbumes Recientes</h2>
            <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
              {TRACKS.map((track) => (
                <div key={track.id} className="flex-shrink-0 w-48 group cursor-pointer">
                  <div className="aspect-square rounded-2xl overflow-hidden mb-4 shadow-xl group-hover:shadow-primary/10 transition-all">
                    <img 
                      src={track.cover} 
                      alt={track.album} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p className="font-bold text-sm truncate">{track.album}</p>
                  <p className="text-xs text-on-surface-variant">{track.artist}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-12">
          {/* Suggested Artists */}
          <div className="bg-surface-low/50 rounded-[2.5rem] p-8 border border-white/5">
            <h2 className="text-xl font-bold font-headline mb-8">Artistas Sugeridos</h2>
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-14 h-14 rounded-full overflow-hidden shadow-lg">
                    <img 
                      src={`https://picsum.photos/seed/artist${i}/200/200`} 
                      alt="Artist" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">Artista {i}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">1.2M Oyentes</p>
                  </div>
                  <button className="text-primary text-[10px] font-bold px-4 py-1.5 border border-primary/20 rounded-full hover:bg-primary hover:text-background transition-all uppercase tracking-widest">
                    Seguir
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Saved Songs */}
          <div className="bg-surface-low/50 rounded-[2.5rem] p-8 border border-white/5">
            <h2 className="text-xl font-bold font-headline mb-8">Canciones Guardadas</h2>
            <div className="space-y-2">
              {TRACKS.map((track) => (
                <div 
                  key={track.id} 
                  onClick={() => playTrack(track)}
                  className="flex items-center gap-4 p-3 hover:bg-surface-high rounded-2xl transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-surface-high flex items-center justify-center relative overflow-hidden">
                    <Music2 className="w-5 h-5 text-primary group-hover:hidden" />
                    <Play className="w-5 h-5 text-primary hidden group-hover:block fill-current" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{track.title}</p>
                    <p className="text-xs text-on-surface-variant truncate">{track.artist}</p>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-mono">4:03</span>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-3 text-[10px] font-bold text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
              Mostrar más
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
