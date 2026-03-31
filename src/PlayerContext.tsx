/**
 * src/PlayerContext.tsx
 * – Dynamic queue (queue takes priority over static TRACKS)
 * – prevTrack restarts song if > 3s played
 * – Stats pushed to API when a track starts (if logged in)
 * – likedTracks synced to API when logged in
 */

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Track, TRACKS } from './types';
import { resolveYouTubeId } from './lib/searchServices';
import { API_BASE } from './AuthContext';

// ── Types ─────────────────────────────────────
interface PlayerContextType {
  currentTrack:   Track;
  isPlaying:      boolean;
  progress:       number;
  volume:         number;
  currentTime:    number;
  duration:       number;
  isShuffle:      boolean;
  isRepeat:       boolean;
  queue:          Track[];
  togglePlay:     () => void;
  nextTrack:      () => void;
  prevTrack:      () => void;
  seek:           (time: number) => void;
  setVolume:      (v: number) => void;
  toggleShuffle:  () => void;
  toggleRepeat:   () => void;
  playTrack:      (track: Track) => void;
  addToQueue:     (track: Track) => void;
  removeFromQueue:(index: number) => void;
  clearQueue:     () => void;
  likedTracks:    Track[];
  toggleLike:     (track: Track) => void;
  isLiked:        (trackId: string) => boolean;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track>(TRACKS[0]);
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [volume,       setVolumeState]  = useState(0.7);
  const [currentTime,  setCurrentTime]  = useState(0);
  const [duration,     setDuration]     = useState(0);
  const [isShuffle,    setIsShuffle]    = useState(false);
  const [isRepeat,     setIsRepeat]     = useState(false);
  const [queue,        setQueue]        = useState<Track[]>([]);

  const [likedTracks, setLikedTracks] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('midnight-curator-liked');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const [isYtReady, setIsYtReady] = useState(false);

  // ── YouTube API init ──────────────────────
  useEffect(() => {
    const tag = document.createElement('script');
    tag.src   = 'https://www.youtube.com/iframe_api';
    document.getElementsByTagName('script')[0].parentNode?.insertBefore(
      tag, document.getElementsByTagName('script')[0]
    );

    (window as any).onYouTubeIframeAPIReady = () => {
      ytPlayerRef.current = new (window as any).YT.Player('youtube-player-hidden', {
        height: '0', width: '0', videoId: '',
        playerVars: { autoplay: 0, controls: 0 },
        events: {
          onReady: () => setIsYtReady(true),
          onStateChange: (e: any) => {
            if (e.data === 0) {
              if (isRepeat) ytPlayerRef.current.playVideo();
              else          nextTrack();
            }
          },
        },
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Polling timer ─────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      if (currentTrack.isYouTube && ytPlayerRef.current?.getCurrentTime) {
        setCurrentTime(ytPlayerRef.current.getCurrentTime() || 0);
        setDuration(ytPlayerRef.current.getDuration()       || 0);
      } else if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime          || 0);
        setDuration(isFinite(audioRef.current.duration)
          ? audioRef.current.duration : 0);
      }
    }, 500);
    return () => clearInterval(id);
  }, [currentTrack]);

  // ── Load / switch track ───────────────────
  useEffect(() => {
    const loadTrack = async () => {
      if (currentTrack.isYouTube) {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
        if (ytPlayerRef.current) {
          if (currentTrack.isSearchMode) {
            ytPlayerRef.current.loadPlaylist({ listType: 'search', list: currentTrack.id, index: 0 });
          } else if (ytPlayerRef.current.loadVideoById) {
            ytPlayerRef.current.loadVideoById(currentTrack.id);
          }
          ytPlayerRef.current.setVolume(volume * 100);
          if (isPlaying) ytPlayerRef.current.playVideo();
          else           ytPlayerRef.current.pauseVideo();
        }
      } else {
        if (ytPlayerRef.current?.pauseVideo) ytPlayerRef.current.pauseVideo();

        if (!audioRef.current) {
          audioRef.current = new Audio(currentTrack.audioUrl);
        } else {
          audioRef.current.src = currentTrack.audioUrl;
        }

        const audio = audioRef.current;
        audio.volume = volume;

        const onEnded = () => {
          if (isRepeat) { audio.currentTime = 0; audio.play(); }
          else          nextTrack();
        };
        audio.addEventListener('ended', onEnded);
        if (isPlaying) audio.play().catch(console.error);
        return () => audio.removeEventListener('ended', onEnded);
      }
    };
    loadTrack();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack]);

  // ── Play / pause sync ─────────────────────
  useEffect(() => {
    if (currentTrack.isYouTube && ytPlayerRef.current?.playVideo) {
      if (isPlaying) ytPlayerRef.current.playVideo();
      else           ytPlayerRef.current.pauseVideo();
    } else if (audioRef.current) {
      if (isPlaying) audioRef.current.play().catch(console.error);
      else           audioRef.current.pause();
    }
  }, [isPlaying]);

  // ── Volume sync ───────────────────────────
  useEffect(() => {
    if (currentTrack.isYouTube && ytPlayerRef.current?.setVolume) {
      ytPlayerRef.current.setVolume(volume * 100);
    } else if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // ── Track stat recording ──────────────────
  useEffect(() => {
    if (currentTrack.isRadio) return;
    const token = localStorage.getItem('mc_token');
    if (!token) return;
    fetch(`${API_BASE}/api/stats/play`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify({
        trackId:   currentTrack.id,
        title:     currentTrack.title,
        artist:    currentTrack.artist,
        album:     currentTrack.album,
        coverUrl:  currentTrack.cover,
        isYouTube: currentTrack.isYouTube ?? false,
      }),
    }).catch(() => {/* silently ignore if API offline */});
  }, [currentTrack.id]);

  // ── Controls ──────────────────────────────
  const togglePlay    = () => setIsPlaying(p => !p);
  const toggleShuffle = () => setIsShuffle(p => !p);
  const toggleRepeat  = () => setIsRepeat(p => !p);

  // Forward – consume queue first, then fall back to TRACKS array
  const nextTrack = useCallback(() => {
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      setQueue(rest);
      playTrackInternal(next);
      return;
    }
    const idx = TRACKS.findIndex(t => t.id === currentTrack.id);
    const nextIdx = isShuffle
      ? Math.floor(Math.random() * TRACKS.length)
      : (idx + 1) % TRACKS.length;
    playTrackInternal(TRACKS[nextIdx]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue, currentTrack, isShuffle]);

  // Backward – restart if > 3 s elapsed, else go to previous
  const prevTrack = useCallback(() => {
    if (currentTime > 3) { seek(0); return; }
    const idx     = TRACKS.findIndex(t => t.id === currentTrack.id);
    const prevIdx = (idx - 1 + TRACKS.length) % TRACKS.length;
    playTrackInternal(TRACKS[prevIdx]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, currentTrack]);

  const seek = (time: number) => {
    if (currentTrack.isYouTube && ytPlayerRef.current?.seekTo) {
      ytPlayerRef.current.seekTo(time, true);
    } else if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    setCurrentTime(time);
  };

  const setVolume = (v: number) => setVolumeState(Math.max(0, Math.min(1, v)));

  // ── Queue management ─────────────────────
  const addToQueue      = (t: Track) => setQueue(prev => [...prev, t]);
  const removeFromQueue = (i: number) => setQueue(prev => prev.filter((_, idx) => idx !== i));
  const clearQueue      = () => setQueue([]);

  // ── Internal play helper ─────────────────
  async function playTrackInternal(track: Track) {
    setCurrentTime(0);
    setDuration(0);

    if (track.isRadio) {
      setCurrentTrack(track);
      setIsPlaying(true);
      return;
    }

    setCurrentTrack(track);
    setIsPlaying(true);

    // Resolve YouTube ID if needed
    if (!track.isYouTube && track.isSearchMode) {
      try {
        const ytId = await resolveYouTubeId(track.artist, track.title);
        if (ytId) {
          setCurrentTrack(prev => ({ ...prev, id: ytId, isYouTube: true, isSearchMode: false }));
        }
      } catch (e) {
        console.error('Could not resolve YouTube ID', e);
      }
    }
  }

  const playTrack = (track: Track) => playTrackInternal(track);

  // ── Likes (local + API) ──────────────────
  const toggleLike = (track: Track) => {
    const token = localStorage.getItem('mc_token');

    setLikedTracks(prev => {
      const liked = prev.some(t => t.id === track.id);
      const next  = liked ? prev.filter(t => t.id !== track.id) : [...prev, track];
      localStorage.setItem('midnight-curator-liked', JSON.stringify(next));

      if (token) {
        if (liked) {
          fetch(`${API_BASE}/api/likes/${encodeURIComponent(track.id)}`, {
            method:  'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        } else {
          fetch(`${API_BASE}/api/likes`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body:    JSON.stringify({
              id:        track.id,
              title:     track.title,
              artist:    track.artist,
              album:     track.album,
              cover:     track.cover,
              audioUrl:  track.audioUrl,
              isYouTube: track.isYouTube ?? false,
              duration:  track.duration ?? 0,
            }),
          }).catch(() => {});
        }
      }
      return next;
    });
  };

  const isLiked = (trackId: string) => likedTracks.some(t => t.id === trackId);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <PlayerContext.Provider value={{
      currentTrack, isPlaying, progress, volume, currentTime, duration,
      isShuffle, isRepeat, queue,
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

// ── Hook ──────────────────────────────────────
export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}