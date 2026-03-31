import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Track, TRACKS } from './types';
import { resolveYouTubeId } from './lib/searchServices';

interface PlayerContextType {
  currentTrack: Track;
  isPlaying: boolean;
  progress: number;
  volume: number;
  currentTime: number;
  duration: number;
  isShuffle: boolean;
  isRepeat: boolean;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  playTrack: (track: Track) => void;
  likedTracks: Track[];
  toggleLike: (track: Track) => void;
  isLiked: (trackId: string) => boolean;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track>(TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [likedTracks, setLikedTracks] = useState<Track[]>(() => {
    const saved = localStorage.getItem('midnight-curator-liked');
    return saved ? JSON.parse(saved) : [];
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const [isYtReady, setIsYtReady] = useState(false);

  // Initialize YouTube IFrame API
  useEffect(() => {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    (window as any).onYouTubeIframeAPIReady = () => {
      ytPlayerRef.current = new (window as any).YT.Player('youtube-player-hidden', {
        height: '0',
        width: '0',
        videoId: '',
        playerVars: {
          autoplay: 0,
          controls: 0,
        },
        events: {
          onReady: () => setIsYtReady(true),
          onStateChange: (event: any) => {
            // YT.PlayerState.ENDED = 0
            if (event.data === 0) {
              if (isRepeat) {
                ytPlayerRef.current.playVideo();
              } else {
                nextTrack();
              }
            }
          }
        }
      });
    };
  }, []);

  useEffect(() => {
    const updateTime = () => {
      if (currentTrack.isYouTube && ytPlayerRef.current?.getCurrentTime) {
        setCurrentTime(ytPlayerRef.current.getCurrentTime());
        setDuration(ytPlayerRef.current.getDuration());
      } else if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
        setDuration(audioRef.current.duration);
      }
    };

    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    const loadTrack = async () => {
      if (currentTrack.isYouTube) {
        // Stop audio player
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
        }
        
        if (ytPlayerRef.current) {
          if (currentTrack.isSearchMode) {
            console.log(`Starting playback via YouTube Search mode: ${currentTrack.id}`);
            // Use loadPlaylist with listType:'search' to find the best match dynamically
            ytPlayerRef.current.loadPlaylist({
              listType: 'search',
              list: currentTrack.id, // In search mode, ID is the query
              index: 0
            });
          } else if (ytPlayerRef.current.loadVideoById) {
            ytPlayerRef.current.loadVideoById(currentTrack.id);
          }
          
          if (isPlaying) ytPlayerRef.current.playVideo();
          else ytPlayerRef.current.pauseVideo();
          ytPlayerRef.current.setVolume(volume * 100);
        }
      } else {
        // Stop YT player
        if (ytPlayerRef.current?.pauseVideo) {
          ytPlayerRef.current.pauseVideo();
        }

        if (!audioRef.current) {
          audioRef.current = new Audio(currentTrack.audioUrl);
        } else {
          audioRef.current.src = currentTrack.audioUrl;
        }
        
        const audio = audioRef.current;
        audio.volume = volume;

        const handleEnded = () => {
          if (isRepeat) {
            audio.currentTime = 0;
            audio.play();
          } else {
            nextTrack();
          }
        };

        audio.addEventListener('ended', handleEnded);

        if (isPlaying) {
          audio.play().catch(console.error);
        }

        return () => {
          audio.removeEventListener('ended', handleEnded);
        };
      }
    };

    loadTrack();
  }, [currentTrack]);

  useEffect(() => {
    if (currentTrack.isYouTube) {
      if (ytPlayerRef.current?.playVideo) {
        if (isPlaying) ytPlayerRef.current.playVideo();
        else ytPlayerRef.current.pauseVideo();
      }
    } else if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    const v = volume * 100;
    if (currentTrack.isYouTube && ytPlayerRef.current?.setVolume) {
      ytPlayerRef.current.setVolume(v);
    } else if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const nextTrack = () => {
    const currentIndex = TRACKS.findIndex(t => t.id === currentTrack.id);
    let nextIndex;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * TRACKS.length);
    } else {
      nextIndex = (currentIndex + 1) % TRACKS.length;
    }
    const track = TRACKS[nextIndex];
    if (track) playTrack(track);
  };

  const prevTrack = () => {
    const currentIndex = TRACKS.findIndex(t => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + TRACKS.length) % TRACKS.length;
    const track = TRACKS[prevIndex];
    if (track) playTrack(track);
  };

  const seek = (time: number) => {
    if (currentTrack.isYouTube && ytPlayerRef.current?.seekTo) {
      ytPlayerRef.current.seekTo(time, true);
    } else if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
    setCurrentTime(time);
  };

  const toggleShuffle = () => setIsShuffle(!isShuffle);
  const toggleRepeat = () => setIsRepeat(!isRepeat);

  const playTrack = async (track: Track) => {
    // If it's already a YouTube track, just play it
    if (track.isYouTube) {
      setCurrentTrack(track);
      setIsPlaying(true);
      return;
    }

    // If it's an iTunes track, we'll try to find the full version on YouTube!
    try {
      console.log(`Resolving full audio for: ${track.artist} - ${track.title}`);
      const ytId = await resolveYouTubeId(track.artist, track.title);
      
      if (ytId) {
        const fullTrack: Track = {
          ...track,
          id: ytId,
          isYouTube: true,
          isSearchMode: false,
        };
        setCurrentTrack(fullTrack);
        setIsPlaying(true);
      } else {
        console.warn('Resolution failed, forcing YouTube Search mode as fallback.');
        // THE ULTIMATE FALLBACK: Let the YouTube IFrame find the song!
        const searchTrack: Track = {
          ...track,
          id: `${track.artist} ${track.title}`, // Search query as ID
          isYouTube: true,
          isSearchMode: true,
        };
        setCurrentTrack(searchTrack);
        setIsPlaying(true);
      }
    } catch (error) {
      console.warn('Resolution error, forcing YouTube Search mode as fallback.', error);
      const searchTrack: Track = {
        ...track,
        id: `${track.artist} ${track.title}`,
        isYouTube: true,
        isSearchMode: true,
      };
      setCurrentTrack(searchTrack);
      setIsPlaying(true);
    }
  };

  const toggleLike = (track: Track) => {
    setLikedTracks(prev => {
      const isAlreadyLiked = prev.some(t => t.id === track.id);
      let next;
      if (isAlreadyLiked) {
        next = prev.filter(t => t.id !== track.id);
      } else {
        next = [...prev, track];
      }
      localStorage.setItem('midnight-curator-liked', JSON.stringify(next));
      return next;
    });
  };

  const isLiked = (trackId: string) => likedTracks.some(t => t.id === trackId);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <PlayerContext.Provider value={{
      currentTrack,
      isPlaying,
      progress,
      volume,
      currentTime,
      duration,
      isShuffle,
      isRepeat,
      togglePlay,
      nextTrack,
      prevTrack,
      seek,
      setVolume,
      toggleShuffle,
      toggleRepeat,
      playTrack,
      likedTracks,
      toggleLike,
      isLiked
    }}>
      {children}
      <div id="youtube-player-hidden" style={{ display: 'none' }} />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
