
import { useState, useEffect } from 'react';
import { Track } from '../types';
import { multiSourceSearch } from '../lib/searchServices';
import { Play, Music, Youtube, Apple, Loader2, Heart } from 'lucide-react';
import { usePlayer } from '../PlayerContext';

interface SearchViewProps {
  query: string;
}

export function SearchView({ query }: SearchViewProps) {
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const { playTrack, toggleLike, isLiked } = usePlayer();

  useEffect(() => {
    if (query) {
      handleSearch();
    }
  }, [query]);

  const handleSearch = async () => {
    setLoading(true);
    const searchResults = await multiSourceSearch(query);
    setResults(searchResults);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-secondary font-headline uppercase tracking-widest text-xs">Buscando resultados para "{query}"...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-headline font-black uppercase tracking-tighter">Resultados</h2>
          <p className="text-secondary mt-1">Mostrando coincidencias para <span className="text-primary font-bold">"{query}"</span></p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1 bg-surface-high px-3 py-1.5 rounded-full border border-white/5">
            <Youtube className="w-3 h-3 text-[#FF0000]" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">YouTube</span>
          </div>
          <div className="flex items-center gap-1 bg-surface-high px-3 py-1.5 rounded-full border border-white/5">
            <Apple className="w-3 h-3 text-on-surface" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">iTunes</span>
          </div>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="bg-surface-high/20 rounded-3xl p-12 text-center border-2 border-dashed border-white/5">
          <Music className="w-12 h-12 text-secondary/20 mx-auto mb-4" />
          <p className="text-secondary">No encontramos resultados. Intenta con otros términos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {results.map((track) => (
            <div 
              key={track.id}
              onClick={() => playTrack(track)}
              className="group flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl transition-all cursor-pointer border border-transparent hover:border-white/5"
            >
              <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-lg flex-shrink-0">
                <img src={track.cover} alt={track.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Play className="w-6 h-6 text-background fill-background" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-on-surface truncate group-hover:text-primary transition-colors">{track.title}</h4>
                <p className="text-xs text-secondary truncate">{track.artist}</p>
              </div>
              <div className="hidden md:block px-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-secondary/40">{track.album}</span>
              </div>
              <div className="text-secondary/60 text-xs font-mono mr-4">
                {Math.floor(track.duration / 60)}:{Math.floor(track.duration % 60).toString().padStart(2, '0')}
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleLike(track); }}
                className="hover:scale-110 transition-transform p-3 text-primary"
              >
                <Heart className={`w-5 h-5 ${isLiked(track.id) ? 'fill-current' : ''}`} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
