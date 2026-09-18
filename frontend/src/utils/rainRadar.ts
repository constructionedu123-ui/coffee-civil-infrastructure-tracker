/**
 * RainViewer Live Rainfall Radar Service
 * Fetches latest radar tile path from RainViewer Public API
 * API docs: https://www.rainviewer.com/api/weather-maps-api.html
 */

export interface RainViewerFrame {
  time: number;
  path: string;
}

export interface RainViewerApiResponse {
  version: string;
  generated: number;
  host: string;
  radar: {
    past: RainViewerFrame[];
    nowcast: RainViewerFrame[];
  };
  satellite?: {
    infrared: RainViewerFrame[];
  };
}

let cachedTileUrl: string | null = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Retrieves the latest RainViewer tile layer URL.
 * Refreshes if older than 10 minutes or if forceRefresh is true.
 */
export async function getLatestRainRadarUrl(forceRefresh = false): Promise<string> {
  const now = Date.now();
  if (!forceRefresh && cachedTileUrl && now - lastFetchTime < CACHE_DURATION_MS) {
    return cachedTileUrl;
  }

  try {
    const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    if (!res.ok) {
      throw new Error(`RainViewer API returned status ${res.status}`);
    }
    const data: RainViewerApiResponse = await res.json();
    const pastFrames = data.radar?.past || [];
    if (pastFrames.length === 0) {
      throw new Error('No radar frames available from RainViewer');
    }

    const latestFrame = pastFrames[pastFrames.length - 1];
    const host = data.host || 'https://tilecache.rainviewer.com';
    // Format: {host}{path}/256/{z}/{x}/{y}/2/1_1.png (Color scheme 2 = universal rain color, 1_1 = smooth with snow mask)
    const tileUrl = `${host}${latestFrame.path}/256/{z}/{x}/{y}/2/1_1.png`;

    cachedTileUrl = tileUrl;
    lastFetchTime = now;
    return tileUrl;
  } catch (err) {
    console.warn('Failed to fetch latest RainViewer radar frames, using cached/fallback:', err);
    if (cachedTileUrl) return cachedTileUrl;
    // Reliable static fallback
    return 'https://tilecache.rainviewer.com/v2/radar/c01312d112eb/256/{z}/{x}/{y}/2/1_1.png';
  }
}
