export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  duration?: number; // <-- Cambiado a opcional (?)
  audioUrl: string;
  lyrics?: string[];
  isYouTube?: boolean;
  isSearchMode?: boolean;
  isRadio?: boolean; // <-- Nueva propiedad
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

export const TRACKS: Track[] = [
  {
    id: '1',
    title: 'Neon Horizon',
    artist: 'Midnight Phantom',
    album: 'Drink the Sea',
    cover: 'https://picsum.photos/seed/neon/800/800',
    duration: 252,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    lyrics: [
      'Beyond the stars where the light begins',
      'Tracing shadows on our neon skin',
      'Cruising through the digital abyss',
      'A moment frozen in a synth-wave kiss',
      'The rhythm calls us to the great unknown'
    ]
  },
  {
    id: '2',
    title: 'Midnight City',
    artist: 'M83',
    album: 'Hurry Up, We\'re Dreaming',
    cover: 'https://picsum.photos/seed/city/800/800',
    duration: 243,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: '3',
    title: 'Starboy',
    artist: 'The Weeknd',
    album: 'Starboy',
    cover: 'https://picsum.photos/seed/star/800/800',
    duration: 230,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },
  {
    id: '4',
    title: 'Nightcall',
    artist: 'Kavinsky',
    album: 'OutRun',
    cover: 'https://picsum.photos/seed/night/800/800',
    duration: 258,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  }
];

export const GENRES: Genre[] = [
  { id: '1', name: 'Synthwave', image: 'https://picsum.photos/seed/synth/600/400', isPopular: true },
  { id: '2', name: 'Hyperpop', image: 'https://picsum.photos/seed/hyper/600/400' },
  { id: '3', name: 'Metalcore', image: 'https://picsum.photos/seed/metal/600/400' },
  { id: '4', name: 'Lo-Fi', image: 'https://picsum.photos/seed/lofi/600/400' },
  { id: '5', name: 'Deep House', image: 'https://picsum.photos/seed/house/600/400' },
  { id: '6', name: 'Trap', image: 'https://picsum.photos/seed/trap/600/400' }
];

export const MOODS: Mood[] = [
  { id: '1', name: 'Enfoque', icon: 'Zap' },
  { id: '2', name: 'Zen', icon: 'Wind' },
  { id: '3', name: 'Sueño', icon: 'Moon' },
  { id: '4', name: 'Energía', icon: 'Dumbbell' },
  { id: '5', name: 'Melancolía', icon: 'CloudRain' },
  { id: '6', name: 'Fiesta', icon: 'Music' }
];
