/**
 * RainViewer & Satellite Weather Overlay Service
 * Fetches latest radar tile path from RainViewer Public API and Himawari / NASA GIBS Infrared Satellite
 */

export type WeatherOverlayType = 'radar' | 'satellite';

export interface WeatherLayerUrls {
  radarUrl: string;
  satelliteUrl: string;
}

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

let cachedUrls: WeatherLayerUrls | null = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

// Live NASA GIBS Himawari clean infrared satellite cloud cover (covers Indonesia & Asia-Pacific 24/7)
const HIMAWARI_IR_TILE_URL =
  'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/Himawari_AHI_Band13_Clean_Infrared/default/default/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png';

/**
 * Retrieves latest Weather Tile URLs for Radar and Satellite Clouds.
 */
export async function getLatestWeatherUrls(forceRefresh = false): Promise<WeatherLayerUrls> {
  const now = Date.now();
  if (!forceRefresh && cachedUrls && now - lastFetchTime < CACHE_DURATION_MS) {
    return cachedUrls;
  }

  let radarUrl = 'https://tilecache.rainviewer.com/v2/radar/c01312d112eb/256/{z}/{x}/{y}/2/1_1.png';
  let satelliteUrl = HIMAWARI_IR_TILE_URL;

  try {
    const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
    if (!res.ok) {
      throw new Error(`RainViewer API returned status ${res.status}`);
    }
    const data: RainViewerApiResponse = await res.json();
    const host = data.host || 'https://tilecache.rainviewer.com';

    // 1. Radar Precipitation Frame
    const pastFrames = data.radar?.past || [];
    if (pastFrames.length > 0) {
      const latestRadar = pastFrames[pastFrames.length - 1];
      radarUrl = `${host}${latestRadar.path}/256/{z}/{x}/{y}/2/1_1.png`;
    }

    // 2. Satellite Infrared Cloud Frame (RainViewer if available, otherwise Himawari-9 live)
    const satFrames = data.satellite?.infrared || [];
    if (satFrames.length > 0) {
      const latestSat = satFrames[satFrames.length - 1];
      satelliteUrl = `${host}${latestSat.path}/256/{z}/{x}/{y}/0/0_0.png`;
    } else {
      satelliteUrl = HIMAWARI_IR_TILE_URL;
    }

    cachedUrls = { radarUrl, satelliteUrl };
    lastFetchTime = now;
    return cachedUrls;
  } catch (err) {
    console.warn('Failed to fetch latest RainViewer weather frames, using fallback:', err);
    if (cachedUrls) return cachedUrls;
    return { radarUrl, satelliteUrl };
  }
}

/**
 * Backward-compatible helper for radar URL
 */
export async function getLatestRainRadarUrl(forceRefresh = false): Promise<string> {
  const urls = await getLatestWeatherUrls(forceRefresh);
  return urls.radarUrl;
}
