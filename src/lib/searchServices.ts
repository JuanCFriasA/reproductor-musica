import { Track } from '../types';

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || '';
const ITUNES_ENABLED = import.meta.env.VITE_ITUNES_API_ENABLED !== 'false';

// ── Health & Proxy Management ───────────────
const mirrorHealth: Record<string, { lastFail: number, failCount: number }> = {};
const BLOCK_DURATION = 30000; // 30s
let isQuotaExceeded = sessionStorage.getItem('yt_quota_exceeded') === 'true';

const PIPED_INSTANCES = [
  'pipedapi.kavin.rocks',
  'piped-api.lunar.icu',
  'api.piped.projectsegfau.lt',
  'pipedapi.river.rocks',
  'pipedapi.leptons.xyz',
  'pipedapi.darkness.services',
  'pipedapi.reallyaweso.me',
  'pipedapi.adminforge.de',
  'pipedapi.astartes.rocks'
];

const INV_INSTANCES = [
  'inv.nadeko.net',
  'yewtu.be',
  'invidious.nerdvpn.de',
  'invidious.flokinet.to',
  'invidious.io.lol',
  'inv.tux.pizza',
  'invidious.no-logs.com',
  'invidious.perennial751.xyz'
];

const PROXIES = [
  (u: string) => u, // Direct
  (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  (u: string) => `https://thingproxy.freeboard.io/fetch/${u}`
];

/**
 * Robust fetch with mirror/proxy rotation and JSON unwrapping
 */
async function fetchWithRetry(url: string, mirror: string, options: any = {}): Promise<any> {
    const timeout = options.timeout || 6000;
    
    for (const getProxyUrl of PROXIES) {
        const targetUrl = getProxyUrl(url);
        const proxyId = getProxyUrl.toString().substring(0, 40);
        
        // Skip unhealthy proxies
        if (mirrorHealth[proxyId] && (Date.now() - mirrorHealth[proxyId].lastFail < BLOCK_DURATION)) continue;

        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        try {
            console.log(`[Fetch] Mirando ${mirror} vía: ${targetUrl.substring(0, 60)}...`);
            const res = await fetch(targetUrl, { ...options, signal: controller.signal });
            clearTimeout(id);

            if (res.ok) {
                const text = await res.text();
                try {
                    const parsed = JSON.parse(text);
                    // Handle AllOrigins wrapper
                    if (parsed.contents && typeof parsed.contents === 'string') {
                        return JSON.parse(parsed.contents);
                    }
                    return parsed;
                } catch {
                    throw new Error('Invalid JSON response');
                }
            }
            
            if (res.status === 403 || res.status === 429) {
                mirrorHealth[proxyId] = { lastFail: Date.now(), failCount: (mirrorHealth[proxyId]?.failCount || 0) + 1 };
                continue;
            }
        } catch (err) {
            clearTimeout(id);
            console.warn(`[Fetch] Error en proxy:`, err);
        }
    }
    throw new Error(`Failed to fetch from ${mirror} after trying all proxies`);
}

/**
 * 1. YouTube Data API (Official)
 */
export async function searchYouTubeOfficial(query: string): Promise<Track[]> {
    if (!YOUTUBE_API_KEY || isQuotaExceeded) return [];
    
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`
        );
        const data = await response.json();
        
        if (data.error) {
            if (data.error.message.includes('quota') || response.status === 403) {
                console.warn('[Official] YouTube API Quota Exceeded! Switching to fallbacks.');
                isQuotaExceeded = true;
                sessionStorage.setItem('yt_quota_exceeded', 'true');
            }
            return [];
        }
        
        return (data.items || []).map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            album: 'YouTube',
            cover: item.snippet.thumbnails.high.url,
            duration: 0,
            audioUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            isYouTube: true
        }));
    } catch {
        return [];
    }
}

/**
 * 2. Unofficial YouTube Music (InnerTube)
 */
export async function searchYouTubeMusic(query: string): Promise<Track[]> {
    console.log(`[InnerTube] Buscando en YouTube Music: "${query}"`);
    const payload = {
        context: { client: { clientName: 'WEB_REMIX', clientVersion: '1.20240401.01.00' } },
        query: query,
        filters: 'EgWKAQIIAWoKEAUQAxAEEAkQBQ%3D%3D' // Music focus
    };

    try {
        const targetUrl = `https://music.youtube.com/youtubei/v1/search?alt=json&key=AIzaSyAO_FJ2nm_8u6sR65TMBYQ8SIU5Z-P0`;
        const data = await fetchWithRetry(targetUrl, 'InnerTube', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });
        
        const results: Track[] = [];
        const sections = data.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
        
        for (const section of sections) {
            const shelf = section.musicShelfRenderer || section.shelfRenderer;
            if (!shelf?.contents) continue;
            
            for (const item of shelf.contents) {
                const tr = item.musicResponsiveListItemRenderer;
                if (!tr) continue;
                const vId = tr.playlistItemData?.videoId || tr.navigationEndpoint?.watchEndpoint?.videoId;
                if (!vId) continue;
                
                results.push({
                    id: vId,
                    title: tr.flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || 'Song',
                    artist: tr.flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || 'Unknown',
                    album: 'YouTube Music',
                    cover: `https://img.youtube.com/vi/${vId}/hqdefault.jpg`,
                    duration: 0,
                    audioUrl: `https://www.youtube.com/watch?v=${vId}`,
                    isYouTube: true
                });
            }
        }
        return results;
    } catch (err) {
        console.error('[InnerTube] Failed:', err);
        return [];
    }
}

/**
 * 3. YouTube via Piped
 */
export async function searchYouTubePiped(query: string): Promise<Track[]> {
    const shuffled = [...PIPED_INSTANCES].sort(() => Math.random() - 0.5);
    for (const mirror of shuffled) {
        if (mirrorHealth[mirror] && (Date.now() - mirrorHealth[mirror].lastFail < BLOCK_DURATION)) continue;
        try {
            const url = `https://${mirror}/api/v1/search?q=${encodeURIComponent(query)}&filter=music_videos`;
            const data = await fetchWithRetry(url, mirror);
            return (data.items || []).map((v: any) => ({
                id: v.url?.split('v=')[1] || v.videoId || v.id,
                title: v.title,
                artist: v.uploaderName || v.author,
                album: 'YouTube (Piped)',
                cover: v.thumbnail || `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`,
                isYouTube: true
            }));
        } catch {
            mirrorHealth[mirror] = { lastFail: Date.now(), failCount: (mirrorHealth[mirror]?.failCount || 0) + 1 };
        }
    }
    return [];
}

/**
 * 4. YouTube via Invidious
 */
export async function searchYouTubeInvidious(query: string): Promise<Track[]> {
    const shuffled = [...INV_INSTANCES].sort(() => Math.random() - 0.5);
    for (const mirror of shuffled) {
        if (mirrorHealth[mirror] && (Date.now() - mirrorHealth[mirror].lastFail < BLOCK_DURATION)) continue;
        try {
            const url = `https://${mirror}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
            const data = await fetchWithRetry(url, mirror);
            return (data || []).map((v: any) => ({
                id: v.videoId,
                title: v.title,
                artist: v.author,
                album: 'YouTube (Mirror)',
                cover: `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`,
                isYouTube: true
            }));
        } catch {
            mirrorHealth[mirror] = { lastFail: Date.now(), failCount: (mirrorHealth[mirror]?.failCount || 0) + 1 };
        }
    }
    return [];
}

/**
 * 5. iTunes (Metadata Reference)
 */
export async function searchiTunes(query: string): Promise<Track[]> {
    if (!ITUNES_ENABLED) return [];
    try {
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=15`);
        const data = await res.json();
        return (data.results || []).map((item: any) => ({
            id: item.trackId.toString(),
            title: item.trackName,
            artist: item.artistName,
            album: item.collectionName,
            cover: item.artworkUrl100.replace('100x100', '800x800'),
            audioUrl: item.previewUrl,
            duration: item.trackTimeMillis / 1000,
            isYouTube: false
        }));
    } catch {
        return [];
    }
}

/**
 * CONSOLIDATED SEARCH
 */
export async function multiSourceSearch(query: string): Promise<Track[]> {
    console.log(`%c[Buscador] "${query}"`, 'color: yellow; font-weight: bold;');
    
    // Step 1: Official API
    let results = await searchYouTubeOfficial(query);
    if (results.length > 0) return results;

    // Step 2: YouTube Music Unofficial
    console.log('[Canal] Intentando YouTube Music Directo...');
    results = await searchYouTubeMusic(query);
    if (results.length > 0) return results;

    // Step 3: Mirrors
    console.log('[Canal] Intentando Espejos (Piped/Invidious)...');
    results = await searchYouTubeInvidious(query);
    if (results.length === 0) results = await searchYouTubePiped(query);
    if (results.length > 0) return results;

    // Step 4: iTunes Metadata (Will trigger resolveYouTubeId on play)
    console.warn('[Canal] Fallback a iTunes. Resolviendo audio completo en demanda.');
    return searchiTunes(query);
}

/**
 * UTILITY: Resolve a full YouTube ID from artist/title
 */
export async function resolveYouTubeId(artist: string, title: string): Promise<string | null> {
    const query = `${artist} ${title}`;
    console.log(`[Resolver] Buscando ID para: ${query}`);
    
    // Try YTM first as it's the most accurate
    const ytm = await searchYouTubeMusic(query);
    if (ytm.length > 0) return ytm[0].id;

    // Try mirrors
    const inv = await searchYouTubeInvidious(query);
    if (inv.length > 0) return inv[0].id;

    const piped = await searchYouTubePiped(query);
    if (piped.length > 0) return piped[0].id;

    return null;
}

/**
 * RESTORED: Fetch Top Latin Tracks
 */
export async function getTopLatinTracks(): Promise<Track[]> {
    return multiSourceSearch('top canciones latinoamerica 2024');
}

/**
 * RESTORED: Fetch Curated Recommendations
 */
export async function getRecommendedTracks(): Promise<Track[]> {
    return multiSourceSearch('lofi hip hop chill study beats midnight');
}

/**
 * UTILITY: Fetch Lyrics
 */
export async function getLyrics(artist: string, title: string): Promise<string[] | null> {
    const cleanTitle = title.replace(/\(.*\)|\[.*\]/g, '').trim();
    try {
        const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(cleanTitle)}`);
        const data = await res.json();
        return data.lyrics ? data.lyrics.split('\n') : null;
    } catch {
        return null;
    }
}
