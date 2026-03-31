export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  duration?: number;
  audioUrl: string;
  lyrics?: string[];
  isYouTube?: boolean;
  isSearchMode?: boolean;
  isRadio?: boolean;
}

export interface Genre {
  id: string;
  name: string;
  image: string;
  isPopular?: boolean;
}

export interface Mood {
  id: string;
  name: string;
  icon: string;
}

export interface Notification {
  id: number;
  type: 'friend_request' | 'friend_accepted' | 'system' | 'new_track';
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  created_at: string;
  fromUsername?: string;
  fromAvatar?: string;
}

export interface Friend {
  id: number;
  username: string;
  avatarUrl: string | null;
  displayName: string | null;
  trackTitle?: string;
  artist?: string;
  cover?: string;
  lastSeen?: string;
}

// Empty — songs come dynamically from YouTube / iTunes search
export const TRACKS: Track[] = [];

export const GENRES: Genre[] = [
  { id: '1', name: 'Synthwave',   image: 'https://picsum.photos/seed/synth/600/400',  isPopular: true },
  { id: '2', name: 'Hyperpop',    image: 'https://picsum.photos/seed/hyper/600/400' },
  { id: '3', name: 'Metalcore',   image: 'https://picsum.photos/seed/metal/600/400' },
  { id: '4', name: 'Lo-Fi',       image: 'https://picsum.photos/seed/lofi/600/400' },
  { id: '5', name: 'Deep House',  image: 'https://picsum.photos/seed/house/600/400' },
  { id: '6', name: 'Trap',        image: 'https://picsum.photos/seed/trap/600/400' },
];

export const MOODS: Mood[] = [
  { id: '1', name: 'Enfoque',     icon: 'Zap' },
  { id: '2', name: 'Zen',         icon: 'Wind' },
  { id: '3', name: 'Sueño',       icon: 'Moon' },
  { id: '4', name: 'Energía',     icon: 'Dumbbell' },
  { id: '5', name: 'Melancolía',  icon: 'CloudRain' },
  { id: '6', name: 'Fiesta',      icon: 'Music' },
];