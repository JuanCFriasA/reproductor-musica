/**
 * src/PlayerContext.tsx  v2
 * – No static TRACKS dependency for playback
 * – When track changes → auto-fetch related tracks into queue
 * – Broadcasts now-playing to API (for friends feature)
 * – prevTrack restarts if > 3 s elapsed
 */
import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Track } from './types';
import { resolveYouTubeId } from './lib/searchServices';
import { getRelatedTracks } from './lib/relatedTracks';
import { API_BASE } from './AuthContext';

interface PlayerContextType {
  currentTrack:    Track;
  isPlaying:       boolean;
  progress:        number;
  volume:          number;
  currentTime:     number;
  duration:        number;
  isShuffle:       boolean;
  isRepeat:        boolean;
  queue:           Track[];
  history:         Track[];       // tracks played so far this session
  togglePlay:      () => void;
  nextTrack:       () => void;
  prevTrack:       () => void;
  seek:            (t: number) => void;
  setVolume:       (v: number) => void;
  toggleShuffle:   () => void;
  toggleRepeat:    () => void;
  playTrack:       (track: Track) => void;
  addToQueue:      (track: Track) => void;
  removeFromQueue: (i: number) => void;
  clearQueue:      () => void;
  likedTracks:     Track[];
  toggleLike:      (track: Track) => void;
  isLiked:         (id: string) => boolean;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// Placeholder track shown before the user picks anything
const SILENT_TRACK: Track = {
  id: '__silent__', title: 'Midnight Cruise', artist: 'Busca algo para empezar',
  album: '', cover: 'https://picsum.photos/seed/midnight/800/800',
  audioUrl: '', duration: 0,
};

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track>(SILENT_TRACK);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [volume,       setVol]          = useState(0.7);
  const [currentTime,  setCurrentTime]  = useState(0);
  const [duration,     setDuration]     = useState(0);
  const [isShuffle,    setIsShuffle]    = useState(false);
  const [isRepeat,     setIsRepeat]     = useState(false);
  const [queue,        setQueue]        = useState<Track[]>([]);
  const [history,      setHistory]      = useState<Track[]>([]);

  const [likedTracks, setLikedTracks] = useState<Track[]>(() => {
    try { return JSON.parse(localStorage.getItem('midnight-curator-liked') || '[]'); } catch { return []; }
  });

  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const ytRef       = useRef<any>(null);
  const prevVolRef  = useRef(0.7);

  // ── YouTube API ───────────────────────────────
  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    (window as any).onYouTubeIframeAPIReady = () => {
      ytRef.current = new (window as any).YT.Player('youtube-player-hidden', {
        height: '0', width: '0', videoId: '',
        playerVars: { autoplay: 0, controls: 0 },
        events: {
          onStateChange: (e: any) => {
            if (e.data === 0) isRepeat ? ytRef.current.playVideo() : nextTrack();
          },
        },
      });
    };
  }, []);

  // ── Time polling ─────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      if (currentTrack.isYouTube && ytRef.current?.getCurrentTime) {
        setCurrentTime(ytRef.current.getCurrentTime() || 0);
        setDuration(ytRef.current.getDuration()       || 0);
      } else if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime || 0);
        const d = audioRef.current.duration;
        setDuration(isFinite(d) ? d : 0);
      }
    }, 500);
    return () => clearInterval(id);
  }, [currentTrack]);

  // ── Load track ────────────────────────────────
  useEffect(() => {
    if (currentTrack.id === '__silent__') return;
    const load = async () => {
      if (currentTrack.isYouTube) {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
        if (ytRef.current) {
          if (currentTrack.isSearchMode) {
            ytRef.current.loadPlaylist({ listType: 'search', list: currentTrack.id, index: 0 });
          } else {
            ytRef.current.loadVideoById?.(currentTrack.id);
          }
          ytRef.current.setVolume(volume * 100);
          if (isPlaying) ytRef.current.playVideo();
        }
      } else if (currentTrack.audioUrl) {
        if (ytRef.current?.pauseVideo) ytRef.current.pauseVideo();
        if (!audioRef.current) {
          audioRef.current = new Audio(currentTrack.audioUrl);
        } else {
          audioRef.current.src = currentTrack.audioUrl;
        }
        const audio = audioRef.current;
        audio.volume = volume;
        const onEnded = () => isRepeat ? (audio.currentTime = 0, audio.play()) : nextTrack();
        audio.addEventListener('ended', onEnded);
        if (isPlaying) audio.play().catch(console.error);
        return () => audio.removeEventListener('ended', onEnded);
      }
    };
    load();
  }, [currentTrack]);

  // ── Play/pause sync ──────────────────────────
  useEffect(() => {
    if (currentTrack.isYouTube) {
      isPlaying ? ytRef.current?.playVideo?.() : ytRef.current?.pauseVideo?.();
    } else if (audioRef.current) {
      isPlaying ? audioRef.current.play().catch(console.error) : audioRef.current.pause();
    }
  }, [isPlaying]);

  // ── Volume sync ──────────────────────────────
  useEffect(() => {
    currentTrack.isYouTube
      ? ytRef.current?.setVolume?.(volume * 100)
      : audioRef.current && (audioRef.current.volume = volume);
  }, [volume]);

  // ── Auto-queue related tracks ─────────────────
  useEffect(() => {
    if (currentTrack.id === '__silent__' || currentTrack.isRadio) return;
    // Only auto-fill when queue has fewer than 4 tracks remaining
    if (queue.length >= 4) return;

    getRelatedTracks(currentTrack.id, currentTrack.artist, currentTrack.album, 8)
      .then(related => {
        if (!related.length) return;
        setQueue(prev => {
          const existingIds = new Set(prev.map(t => t.id));
          const fresh = related.filter(t => t.id !== currentTrack.id && !existingIds.has(t.id));
          return [...prev, ...fresh];
        });
      })
      .catch(() => {});
  }, [currentTrack.id]);

  // ── Broadcast now-playing ─────────────────────
  useEffect(() => {
    if (currentTrack.id === '__silent__') return;
    const token = localStorage.getItem('mc_token');
    if (!token) return;
    fetch(`${API_BASE}/api/now-playing`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        trackId:    currentTrack.id,
        trackTitle: currentTrack.title,
        artist:     currentTrack.artist,
        coverUrl:   currentTrack.cover,
      }),
    }).catch(() => {});

    // Record in history
    const token2 = localStorage.getItem('mc_token');
    if (token2 && !currentTrack.isRadio) {
      fetch(`${API_BASE}/api/stats/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token2}` },
        body: JSON.stringify({
          trackId:   currentTrack.id,
          title:     currentTrack.title,
          artist:    currentTrack.artist,
          album:     currentTrack.album,
          coverUrl:  currentTrack.cover,
          isYouTube: currentTrack.isYouTube ?? false,
        }),
      }).catch(() => {});
    }
  }, [currentTrack.id]);

  // ── Controls ──────────────────────────────────
  const togglePlay    = () => setIsPlaying(p => !p);
  const toggleShuffle = () => setIsShuffle(p => !p);
  const toggleRepeat  = () => setIsRepeat(p => !p);

  const nextTrack = useCallback(() => {
    setQueue(prev => {
      if (!prev.length) return prev;
      const [next, ...rest] = prev;
      _play(next);
      return rest;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prevTrack = useCallback(() => {
    if (currentTime > 3) { seek(0); return; }
    setHistory(prev => {
      if (!prev.length) return prev;
      const last = prev[prev.length - 1];
      const rest = prev.slice(0, -1);
      _play(last);
      return rest;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime]);

  const seek = (t: number) => {
    currentTrack.isYouTube
      ? ytRef.current?.seekTo?.(t, true)
      : audioRef.current && (audioRef.current.currentTime = t);
    setCurrentTime(t);
  };

  const setVolume = (v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    if (clamped > 0) prevVolRef.current = clamped;
    setVol(clamped);
  };

  const addToQueue      = (t: Track) => setQueue(p => [...p, t]);
  const removeFromQueue = (i: number) => setQueue(p => p.filter((_, idx) => idx !== i));
  const clearQueue      = () => setQueue([]);

  // Core play logic
  async function _play(track: Track) {
    setCurrentTime(0); setDuration(0);

    if (track.isRadio) {
      setCurrentTrack(track);
      setHistory(h => [...h, currentTrack].filter(t => t.id !== '__silent__'));
      setIsPlaying(true);
      return;
    }

    setCurrentTrack(track);
    setHistory(h => [...h, currentTrack].filter(t => t.id !== '__silent__').slice(-50));
    setIsPlaying(true);

    // Resolve YouTube ID for search-mode tracks
    if (!track.isYouTube && track.isSearchMode) {
      try {
        const ytId = await resolveYouTubeId(track.artist, track.title);
        if (ytId) {
          setCurrentTrack(prev =>
            prev.id === track.id
              ? { ...prev, id: ytId, isYouTube: true, isSearchMode: false }
              : prev
          );
        }
      } catch { /* silent */ }
    }
  }

  const playTrack = (track: Track) => _play(track);

  // ── Likes ─────────────────────────────────────
  const toggleLike = (track: Track) => {
    const token = localStorage.getItem('mc_token');
    setLikedTracks(prev => {
      const liked = prev.some(t => t.id === track.id);
      const next  = liked ? prev.filter(t => t.id !== track.id) : [...prev, track];
      localStorage.setItem('midnight-curator-liked', JSON.stringify(next));
      if (token) {
        if (liked) {
          fetch(`${API_BASE}/api/likes/${encodeURIComponent(track.id)}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        } else {
          fetch(`${API_BASE}/api/likes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ id: track.id, title: track.title, artist: track.artist,
              album: track.album, cover: track.cover, audioUrl: track.audioUrl,
              isYouTube: track.isYouTube ?? false, duration: track.duration ?? 0 }),
          }).catch(() => {});
        }
      }
      return next;
    });
  };

  const isLiked  = (id: string) => likedTracks.some(t => t.id === id);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <PlayerContext.Provider value={{
      currentTrack, isPlaying, progress, volume, currentTime, duration,
      isShuffle, isRepeat, queue, history,
      togglePlay, nextTrack, prevTrack, seek, setVolume,
      toggleShuffle, toggleRepeat,
      playTrack, addToQueue, removeFromQueue, clearQueue,
      likedTracks, toggleLike, isLiked,
    }}>
      {children}
      <div id="youtube-player-hidden" style={{ display: 'none' }} />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}