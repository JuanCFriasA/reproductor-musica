/**
 * src/lib/relatedTracks.ts
 * Given a track that just started playing, returns up to 8 related tracks
 * using the iTunes Search API (free, no key needed).
 *
 * Strategy:
 *   1. Search by artist → get more songs by same artist
 *   2. If <4 results, search by album
 *   3. Never returns the currently-playing track
 */
import { Track } from '../types';

const ITUNES = 'https://itunes.apple.com/search';

interface ItunesResult {
  trackId:    number;
  trackName:  string;
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
  trackTimeMillis?: number;
  previewUrl?: string;
}

function mapItunes(r: ItunesResult): Track {
  return {
    id:        String(r.trackId),
    title:     r.trackName,
    artist:    r.artistName,
    album:     r.collectionName || r.artistName,
    cover:     r.artworkUrl100?.replace('100x100', '600x600') || '',
    duration:  r.trackTimeMillis ? Math.round(r.trackTimeMillis / 1000) : 0,
    audioUrl:  '',          // will be resolved via YouTube when played
    isYouTube: false,
    isSearchMode: true,     // PlayerContext resolves this to a real YT id
  };
}

export async function getRelatedTracks(
  currentId: string,
  artist: string,
  album: string,
  limit = 8
): Promise<Track[]> {
  const seen = new Set<string>([currentId]);
  const results: Track[] = [];

  // ── By artist ─────────────────────────────────
  try {
    const url = `${ITUNES}?term=${encodeURIComponent(artist)}&entity=song&limit=20&country=us`;
    const res  = await fetch(url);
    const json = await res.json();
    for (const r of (json.results ?? []) as ItunesResult[]) {
      if (!r.trackId || seen.has(String(r.trackId))) continue;
      seen.add(String(r.trackId));
      results.push(mapItunes(r));
      if (results.length >= limit) break;
    }
  } catch { /* silent */ }

  // ── By album (if not enough) ──────────────────
  if (results.length < 4 && album && album !== artist) {
    try {
      const url = `${ITUNES}?term=${encodeURIComponent(album)}&entity=song&limit=12&country=us`;
      const res  = await fetch(url);
      const json = await res.json();
      for (const r of (json.results ?? []) as ItunesResult[]) {
        if (!r.trackId || seen.has(String(r.trackId))) continue;
        seen.add(String(r.trackId));
        results.push(mapItunes(r));
        if (results.length >= limit) break;
      }
    } catch { /* silent */ }
  }

  return results.slice(0, limit);
}