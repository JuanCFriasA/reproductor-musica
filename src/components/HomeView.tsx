import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Loader2, Music2, TrendingUp, Sparkles, Heart } from 'lucide-react';
import { TRACKS } from '../types';
import { usePlayer } from '../PlayerContext';
import { getTopLatinTracks, getRecommendedTracks } from '../lib/searchServices';
import { cn } from '../lib/utils';
import { Track } from '../types';

export function HomeView() {
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [topLatin, setTopLatin] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const { playTrack, toggleLike, isLiked } = usePlayer();

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [rec, top] = await Promise.all([
          getRecommendedTracks(),
          getTopLatinTracks()
        ]);
        if (rec.length > 0) setRecommendations(rec.slice(0, 6));
        if (top.length > 0) setTopLatin(top.slice(0, 10));
      } catch (err) {
        console.error('Home Data Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-secondary font-headline uppercase tracking-widest text-xs animate-pulse">Sincronizando con YouTube Music...</p>
      </div>
    );
  }

  const heroTrack = recommendations[0] || TRACKS[0];

  return (
    <div className="space-y-16 pb-12 animate-in fade-in duration-700">
      {/* Editorial Hero */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-surface-low h-[450px] flex items-center group shadow-2xl border border-white/5">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-screen group-hover:scale-105 transition-transform duration-1000" 
          style={{ backgroundImage: `url(${heroTrack.cover})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="relative z-10 px-12 md:w-2/3">
          <div className="flex items-center gap-2 bg-primary/20 text-primary px-3 py-1 rounded-full uppercase tracking-widest font-bold text-[10px] mb-6 inline-block">
            <Sparkles className="w-3 h-3" />
            Novedad Editorial
          </div>
          <h2 className="text-5xl md:text-7xl font-extrabold font-headline leading-none text-white mb-6 drop-shadow-2xl">
            {heroTrack.title.split(' ').slice(0, 3).join(' ')} <br />
            <span className="text-primary italic">Latinoamérica Top</span>
          </h2>
          <p className="text-on-surface-variant text-lg max-w-md mb-8 font-light leading-relaxed line-clamp-2">
            Disfruta de "{heroTrack.title}" por <span className="font-bold text-on-surface">{heroTrack.artist}</span>, seleccionado como track principal de hoy.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => playTrack(heroTrack)}
              className="px-10 py-4 bg-primary text-background font-bold rounded-full flex items-center gap-3 hover:scale-105 transition-transform shadow-xl shadow-primary/20"
            >
              <Play className="w-5 h-5 fill-current" />
              Reproducir Ahora
            </button>
            <button 
              onClick={() => toggleLike(heroTrack)}
              className="w-14 h-14 border border-secondary/20 rounded-full flex items-center justify-center hover:bg-surface-high transition-colors"
            >
              <Heart className={cn("w-6 h-6", isLiked(heroTrack.id) ? "fill-primary text-primary" : "text-white")} />
            </button>
          </div>
        </div>
      </section>

      {/* Recommended for You */}
      <section>
        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="text-2xl font-bold font-headline flex items-center gap-2">
              <div className="w-1 h-8 bg-primary rounded-full" />
              Recomendaciones para ti
            </h3>
            <p className="text-sm text-on-surface-variant">Vibras curadas directamente de YouTube</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {(recommendations.length > 0 ? recommendations : TRACKS).map((track, i) => (
            <motion.div 
              key={track.id + i}
              whileHover={{ y: -8 }}
              className="group cursor-pointer"
              onClick={() => playTrack(track)}
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-surface-high shadow-lg">
                <img 
                  src={track.cover} 
                  alt={track.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-background shadow-2xl">
                    <Play className="w-5 h-5 fill-current ml-1" />
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-start mt-4">
                <div className="flex-1 min-w-0 mr-4">
                  <h4 className="font-headline font-bold truncate text-sm hover:text-primary transition-colors">{track.title}</h4>
                  <p className="text-[10px] text-on-surface-variant line-clamp-1 uppercase tracking-widest mt-1 opacity-60 font-bold">{track.artist}</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleLike(track); }}
                  className="text-primary hover:scale-110 transition-transform flex-shrink-0"
                >
                  <Heart className={cn("w-4 h-4", isLiked(track.id) ? "fill-current" : "")} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Top Ranking Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-surface-high rounded-xl flex items-center justify-center text-primary">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-3xl font-black font-headline uppercase tracking-tighter italic">Tendencias Actuales</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {topLatin.length > 0 ? topLatin.slice(0, 6).map((track) => (
              <div 
                key={track.id}
                onClick={() => playTrack(track)}
                className="flex items-center gap-4 p-4 bg-surface-low/30 hover:bg-surface-high rounded-2xl transition-all group cursor-pointer border border-white/5 active:scale-95"
              >
                <div className="relative h-16 w-16 flex-shrink-0">
                  <img 
                    src={track.cover} 
                    alt={track.title} 
                    className="h-full w-full rounded-xl object-cover shadow-lg"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center transition-opacity">
                    <Play className="w-6 h-6 text-background fill-background" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold truncate text-sm">{track.title}</h5>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold opacity-60 mt-0.5">{track.artist}</p>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center">
                <Loader2 className="w-8 h-8 text-secondary animate-spin mx-auto mb-4" />
                <p className="text-secondary text-sm">Cargando tendencias...</p>
              </div>
            )}
          </div>
        </div>


      </div>
    </div>
  );
}
