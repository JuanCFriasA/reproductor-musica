import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Play, Heart, Music2, ChevronRight, Sparkles, Disc } from 'lucide-react';
import { usePlayer } from '../PlayerContext';
import { multiSourceSearch } from '../lib/searchServices';
import { Track } from '../types';

export function LibraryView() {
  const { playTrack, likedTracks, toggleLike, isLiked } = usePlayer();
  const [recommended, setRecommended] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMidnightMix = async () => {
      setLoading(true);
      try {
        const results = await multiSourceSearch("Midnight Synthwave curated playlist");
        setRecommended(results);
      } catch (error) {
        console.error("Error fetching library mix:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMidnightMix();
  }, []);

  return (
    <div className="space-y-16">
      {/* Dynamic Header */}
      <section className="relative overflow-hidden rounded-[2.5rem] aspect-[21/9] md:aspect-[3/1] bg-surface-low group">
        <img 
          src={likedTracks.length > 0 ? likedTracks[0].cover : "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=1600&auto=format&fit=crop"} 
          alt="Library" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 p-12 w-full flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-6 inline-block">Tu Biblioteca</span>
            <h1 className="text-4xl md:text-6xl font-extrabold font-headline tracking-tighter mb-4">
              {likedTracks.length > 0 ? "Tus Favoritos" : "Colección Midnight"}
            </h1>
            <p className="text-on-surface-variant max-w-lg text-sm md:text-base leading-relaxed">
              {likedTracks.length > 0 
                ? `Tienes ${likedTracks.length} tracks guardados en tu frecuencia personal.`
                : "Aún no has guardado canciones. Explora la noche y llena tu biblioteca."}
            </p>
          </div>
          {likedTracks.length > 0 && (
            <button 
              onClick={() => playTrack(likedTracks[0])}
              className="bg-primary text-background p-6 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
            >
              <Play className="w-8 h-8 fill-current ml-1" />
            </button>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Liked Tracks / Main Content */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-headline flex items-center gap-3">
              <Heart className="w-6 h-6 text-primary fill-current" />
              Canciones que te gustan
            </h2>
          </div>

          {likedTracks.length === 0 ? (
            <div className="bg-surface-low rounded-3xl p-12 text-center border border-white/5">
              <div className="w-16 h-16 bg-surface-high rounded-full flex items-center justify-center mx-auto mb-6">
                <Music2 className="w-8 h-8 text-on-surface-variant" />
              </div>
              <h3 className="text-xl font-bold mb-2">Tu colección está vacía</h3>
              <p className="text-on-surface-variant mb-6">Las canciones que marques con un corazón aparecerán aquí.</p>
              <button className="text-primary font-bold text-xs uppercase tracking-widest hover:underline">
                Explorar Géneros
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {likedTracks.map((track) => (
                <div 
                  key={track.id}
                  className="flex items-center gap-4 p-4 hover:bg-surface-high rounded-2xl transition-all group cursor-pointer border border-transparent hover:border-white/5"
                >
                  <div className="relative w-12 h-12 flex-shrink-0" onClick={() => playTrack(track)}>
                    <img src={track.cover} alt="" className="w-full h-full object-cover rounded-lg" />
                    <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center rounded-lg">
                      <Play className="w-5 h-5 text-white fill-current" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0" onClick={() => playTrack(track)}>
                    <h4 className="font-bold text-sm truncate">{track.title}</h4>
                    <p className="text-xs text-on-surface-variant truncate">{track.artist}</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleLike(track); }}
                    className="text-primary"
                  >
                    <Heart className="w-5 h-5 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
