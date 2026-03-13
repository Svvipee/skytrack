// ─── Flight & Aircraft Types ──────────────────────────────────────────────────

export interface FlightState {
  icao24: string;
  callsign: string | null;
  origin_country: string;
  time_position: number | null;
  last_contact: number;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null;
  on_ground: boolean;
  velocity: number | null;         // m/s
  true_track: number | null;       // degrees from north
  vertical_rate: number | null;    // m/s
  geo_altitude: number | null;
  squawk: string | null;
  spi: boolean;
  position_source: number;
}

export interface Airport {
  iata: string;
  icao: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  elevation?: number;
}

export interface FlightDetails {
  icao24: string;
  callsign: string;
  flightNumber: string | null;
  airline: string | null;
  airlineIata: string | null;
  airlineIcao: string | null;
  origin: Airport | null;
  destination: Airport | null;
  departureTime: string | null;
  arrivalTime: string | null;
  scheduledDeparture: string | null;
  scheduledArrival: string | null;
  status: 'scheduled' | 'active' | 'landed' | 'cancelled' | 'unknown';
  aircraftModel: string | null;
  aircraftType: string | null;
  registration: string | null;
  age: string | null;
  imageUrl: string | null;
}

export interface EnrichedFlight extends FlightState {
  details: FlightDetails | null;
  // Computed display values
  altitudeFt: number | null;
  speedKts: number | null;
  verticalRateFpm: number | null;
  headingDeg: number | null;
}

export interface SavedFlight {
  id: string;
  icao24: string;
  callsign: string;
  savedAt: string;
  snapshot: EnrichedFlight;
  userId?: string;
}

// ─── OpenSky API Response ──────────────────────────────────────────────────────

export interface OpenSkyResponse {
  time: number;
  states: (string | number | boolean | null)[][] | null;
}

// ─── Search Types ──────────────────────────────────────────────────────────────

export interface SearchResult {
  icao24: string;
  callsign: string;
  airline?: string;
  origin?: string;
  destination?: string;
  latitude?: number;
  longitude?: number;
  altitude?: number | null;
  score: number;
}

// ─── Theme Types ───────────────────────────────────────────────────────────────

export type TimeOfDay = 'dawn' | 'day' | 'sunset' | 'night';

export interface ThemeConfig {
  timeOfDay: TimeOfDay;
  hour: number;
  colors: {
    primary: string;
    accent: string;
    surface: string;
    surface2: string;
    text: string;
    textMuted: string;
    border: string;
    glow: string;
    bg: string;
    bgGradient: string;
  };
  globeAtmosphere: string;
  globeImageUrl: string;
  backgroundImageUrl: string;
  starsVisible: boolean;
}

// ─── Auth Types ────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

// ─── UI Types ─────────────────────────────────────────────────────────────────

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface GlobePoint {
  lat: number;
  lng: number;
  altitude?: number;
  color?: string;
  data?: EnrichedFlight;
}

export interface GlobeArc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color?: string[];
  data?: SavedFlight;
}
