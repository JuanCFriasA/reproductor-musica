
import { Track } from '../types';

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || '';
const YTMUSIC_API_URL = import.meta.env.VITE_YTMUSIC_API_URL || '';
const ITUNES_ENABLED = import.meta.env.VITE_ITUNES_API_ENABLED !== 'false';
const GENIUS_API_KEY = import.meta.env.VITE_GENIUS_API_KEY || '';

/**
 * 1. YouTube Data API (Official)
 */
export async function searchYouTubeOfficial(query: string): Promise<Track[]> {
  if (!YOUTUBE_API_KEY) return [];
  
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`
    );
    const data = await response.json();
    
    if (data.error) throw new Error(data.error.message);
    
    return data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      album: 'YouTube',
      cover: item.snippet.thumbnails.high.url,
      duration: 0,
      // We'll store a YT tag so the player knows to resolve this later or use a known proxy
      audioUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      isYouTube: true // Flag to identify YouTube tracks
    }));
  } catch (error) {
    console.error('YouTube API Error:', error);
    return [];
  }
}

/**
 * 2. Unofficial YouTube/Music API (ytmusicapi)
 * Note: Since this is a browser-based app, we'll implement a proxy-friendly version
 * or a placeholder that the user can later connect to a Node/Python backend.
 * For now, we'll use a public search endpoint if available or a similar mock.
 */
export async function searchYouTubeMusic(query: string): Promise<Track[]> {
  // In a real scenario, this would call a local backend that uses the ytmusicapi library.
  // For the frontend "mientras tanto", we'll simulate it or use a public alternative.
  console.log('Searching YouTube Music (Unofficial) for:', query);
  // Placeholder implementation
  return [];
}

/**
 * 3. iTunes Search API (Apple Music)
 */
export async function searchiTunes(query: string): Promise<Track[]> {
  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=10`
    );
    const data = await response.json();
    
    return data.results.map((item: any) => ({
      id: item.trackId.toString(),
      title: item.trackName,
      artist: item.artistName,
      album: item.collectionName,
      cover: item.artworkUrl100.replace('100x100', '600x600'),
      duration: Math.floor(item.trackTimeMillis / 1000),
      audioUrl: item.previewUrl, // Direct audio link for previews!
    }));
  } catch (error) {
    console.error('iTunes Search Error:', error);
    return [];
  }
}

/**
 * Consolidated Multi-Source Search with Fallback Logic
 * Primary: YouTube Data API (Official)
 * Secondary: YouTube Music API (Unofficial)
 * Tertiary: iTunes Search API (Apple Music)
 */
export async function multiSourceSearch(query: string): Promise<Track[]> {
  console.log(`Starting multi-source search for: "${query}"`);
  
  // 1. Try YouTube Official (Primary)
  if (YOUTUBE_API_KEY) {
    const ytOfficial = await searchYouTubeOfficial(query);
    if (ytOfficial && ytOfficial.length > 0) {
      console.log('Results found via YouTube Official API');
      return ytOfficial;
    }
  }

  // 1.5. Try Invidious (Search Fallback for Quota issues)
  console.log('Falling back to YouTube Mirror (Invidious)...');
  const ytMirror = await searchYouTubeInvidious(query);
  if (ytMirror && ytMirror.length > 0) {
    console.log('Results found via YouTube Mirror (Invidious)');
    return ytMirror;
  }

  // 2. Try YouTube Music Unofficial (Secondary Fallback)
  if (YTMUSIC_API_URL) {
    console.log('Falling back to YouTube Music (Unofficial)...');
    const ytUnofficial = await searchYouTubeMusic(query);
    if (ytUnofficial && ytUnofficial.length > 0) {
      console.log('Results found via YouTube Music (Unofficial)');
      return ytUnofficial;
    }
  }

  // 3. Try iTunes (Tertiary Fallback)
  // iTunes is a public API (No key required), that's why it works by default!
  if (ITUNES_ENABLED) {
    console.log('Falling back to iTunes Search (Public API)...');
    const itunesResults = await searchiTunes(query);
    return itunesResults;
  }

  return [];
}

/**
 * Fetch Top Latin Tracks (Real Data)
 */
export async function getTopLatinTracks(): Promise<Track[]> {
  return searchYouTubeOfficial('top canciones latinoamerica 2024');
}

/**
 * Fetch Curated Recommendations (Real Data)
 */
export async function getRecommendedTracks(): Promise<Track[]> {
  return searchYouTubeOfficial('lofi hip hop chill study beats midnight');
}

/**
 * Fetch Lyrics from multiple sources
 */
export async function getLyrics(artist: string, title: string): Promise<string[] | null> {
  const cleanTitle = title.replace(/\(.*\)|\[.*\]/g, '').trim();
  const cleanArtist = artist.trim();
  
  console.log(`Searching lyrics for: ${cleanArtist} - ${cleanTitle}`);

  // 1. Try Lyrics.ovh (Primary for text)
  try {
    const response = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`);
    const data = await response.json();
    if (data.lyrics) {
      return data.lyrics.split('\n').filter((line: string) => line.trim() !== '');
    }
  } catch (error) {
    console.warn('Lyrics.ovh Error:', error);
  }

  // 2. Try Genius API (For metadata/link)
  if (GENIUS_API_KEY) {
    try {
      const response = await fetch(
        `https://api.genius.com/search?q=${encodeURIComponent(`${cleanArtist} ${cleanTitle}`)}&access_token=${GENIUS_API_KEY}`
      );
      const data = await response.json();
      const hit = data.response.hits?.[0]?.result;
      if (hit) {
        // Since Genius API doesn't return lyrics text, we return a hint or stay null
        // and handle the link in the UI.
        console.log('Genius found hit:', hit.url);
      }
    } catch (error) {
       console.error('Genius API Error:', error);
    }
  }

  return null;
}

/**
 * 1.5. YouTube Search via Invidious (Public Proxy / Unofficial)
 * No API key required. High reliability fallback for search with retries.
 */
const INV_INSTANCES = [
  'yewtu.be',
  'invidious.asir.dev',
  'invidious.projectsegfau.lt',
  'inv.bp.mutix.org',
  'invidious.io.lol',
  'invidious.namazso.eu',
  'invidious.lunar.icu',
  'invidious.mutix.org'
];

export async function searchYouTubeInvidious(query: string, retryCount = 3): Promise<Track[]> {
  // Try up to retryCount different instances
  const shuffled = [...INV_INSTANCES].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < Math.min(retryCount, shuffled.length); i++) {
    const instance = shuffled[i];
    try {
      console.log(`Trying Invidious instance via Proxy: ${instance}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout for proxy

      // Using AllOrigins as CORS Proxy
      const targetUrl = `https://${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

      const response = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) continue;

      return data.slice(0, 10).map((item: any) => ({
        id: item.videoId,
        title: item.title,
        artist: item.author,
        album: 'YouTube (Mirror)',
        cover: `https://img.youtube.com/vi/${item.videoId}/maxresdefault.jpg`,
        duration: item.lengthSeconds || 0,
        audioUrl: `https://www.youtube.com/watch?v=${item.videoId}`,
        isYouTube: true
      }));
    } catch (error) {
      console.warn(`Invidious instance ${instance} via proxy failed, trying next...`);
    }
  }

  return [];
}

/**
 * Helper to resolve a YouTube ID for a given artist/title
 */
export async function resolveYouTubeId(artist: string, title: string): Promise<string | null> {
  const query = `${artist} - ${title}`;
  
  // 1. Try official
  if (YOUTUBE_API_KEY) {
     try {
       const yt = await searchYouTubeOfficial(query);
       if (yt.length > 0) return yt[0].id;
     } catch (e) {
       console.warn('Official YT Search failed in resolution, falling back to mirror.');
     }
  }
  
  // 2. Try Invidious with retries
  const mirror = await searchYouTubeInvidious(query);
  if (mirror.length > 0) return mirror[0].id;
  
  return null;
}
