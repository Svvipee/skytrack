import { OpenSkyResponse, FlightState, EnrichedFlight } from '@/types';

const OPENSKY_BASE = 'https://opensky-network.org/api';

// Parse raw OpenSky state vector array into typed object
export function parseStateVector(sv: (string | number | boolean | null)[]): FlightState {
  return {
    icao24: (sv[0] as string) ?? '',
    callsign: sv[1] ? (sv[1] as string).trim() : null,
    origin_country: (sv[2] as string) ?? '',
    time_position: (sv[3] as number) ?? null,
    last_contact: (sv[4] as number) ?? 0,
    longitude: (sv[5] as number) ?? null,
    latitude: (sv[6] as number) ?? null,
    baro_altitude: (sv[7] as number) ?? null,
    on_ground: (sv[8] as boolean) ?? false,
    velocity: (sv[9] as number) ?? null,
    true_track: (sv[10] as number) ?? null,
    vertical_rate: (sv[11] as number) ?? null,
    geo_altitude: (sv[13] as number) ?? null,
    squawk: (sv[14] as string) ?? null,
    spi: (sv[15] as boolean) ?? false,
    position_source: (sv[16] as number) ?? 0,
  };
}

export function enrichFlight(state: FlightState): EnrichedFlight {
  return {
    ...state,
    details: null,
    altitudeFt: state.baro_altitude ? Math.round(state.baro_altitude * 3.28084) : null,
    speedKts: state.velocity ? Math.round(state.velocity * 1.94384) : null,
    verticalRateFpm: state.vertical_rate ? Math.round(state.vertical_rate * 196.85) : null,
    headingDeg: state.true_track ? Math.round(state.true_track) : null,
  };
}

export function filterValidFlights(states: FlightState[]): FlightState[] {
  return states.filter(
    (s) =>
      s.latitude !== null &&
      s.longitude !== null &&
      !s.on_ground &&
      s.latitude >= -90 &&
      s.latitude <= 90 &&
      s.longitude >= -180 &&
      s.longitude <= 180
  );
}

// Build auth header if credentials provided
function getAuthHeaders(): HeadersInit {
  const user = process.env.OPENSKY_USERNAME;
  const pass = process.env.OPENSKY_PASSWORD;
  if (user && pass) {
    const creds = Buffer.from(`${user}:${pass}`).toString('base64');
    return { Authorization: `Basic ${creds}` };
  }
  return {};
}

// Fetch all live aircraft states
export async function fetchAllStates(bounds?: {
  lamin: number; lamax: number; lomin: number; lomax: number;
}): Promise<OpenSkyResponse> {
  let url = `${OPENSKY_BASE}/states/all`;
  if (bounds) {
    const p = new URLSearchParams({
      lamin: bounds.lamin.toString(),
      lamax: bounds.lamax.toString(),
      lomin: bounds.lomin.toString(),
      lomax: bounds.lomax.toString(),
    });
    url += `?${p}`;
  }

  const res = await fetch(url, {
    headers: getAuthHeaders(),
    next: { revalidate: 15 },
  });

  if (!res.ok) {
    throw new Error(`OpenSky API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

// Fetch flights for a specific aircraft by ICAO24
export async function fetchFlightsByAircraft(
  icao24: string,
  begin: number,
  end: number
): Promise<unknown[]> {
  const url = `${OPENSKY_BASE}/flights/aircraft?icao24=${icao24}&begin=${begin}&end=${end}`;
  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) return [];
  return res.json();
}

// Airline name lookup from callsign prefix (ICAO airline designators)
export const AIRLINE_MAP: Record<string, { name: string; iata: string; icao: string }> = {
  AAL: { name: 'American Airlines', iata: 'AA', icao: 'AAL' },
  UAL: { name: 'United Airlines', iata: 'UA', icao: 'UAL' },
  DAL: { name: 'Delta Air Lines', iata: 'DL', icao: 'DAL' },
  SWA: { name: 'Southwest Airlines', iata: 'WN', icao: 'SWA' },
  BAW: { name: 'British Airways', iata: 'BA', icao: 'BAW' },
  DLH: { name: 'Lufthansa', iata: 'LH', icao: 'DLH' },
  AFR: { name: 'Air France', iata: 'AF', icao: 'AFR' },
  KLM: { name: 'KLM Royal Dutch Airlines', iata: 'KL', icao: 'KLM' },
  UAE: { name: 'Emirates', iata: 'EK', icao: 'UAE' },
  ETD: { name: 'Etihad Airways', iata: 'EY', icao: 'ETD' },
  QTR: { name: 'Qatar Airways', iata: 'QR', icao: 'QTR' },
  SIA: { name: 'Singapore Airlines', iata: 'SQ', icao: 'SIA' },
  CPA: { name: 'Cathay Pacific', iata: 'CX', icao: 'CPA' },
  ANA: { name: 'All Nippon Airways', iata: 'NH', icao: 'ANA' },
  JAL: { name: 'Japan Airlines', iata: 'JL', icao: 'JAL' },
  CCA: { name: 'Air China', iata: 'CA', icao: 'CCA' },
  CSN: { name: 'China Southern Airlines', iata: 'CZ', icao: 'CSN' },
  CES: { name: 'China Eastern Airlines', iata: 'MU', icao: 'CES' },
  THA: { name: 'Thai Airways', iata: 'TG', icao: 'THA' },
  MAS: { name: 'Malaysia Airlines', iata: 'MH', icao: 'MAS' },
  GIA: { name: 'Garuda Indonesia', iata: 'GA', icao: 'GIA' },
  SKW: { name: 'SkyWest Airlines', iata: 'OO', icao: 'SKW' },
  EZY: { name: 'easyJet', iata: 'U2', icao: 'EZY' },
  RYR: { name: 'Ryanair', iata: 'FR', icao: 'RYR' },
  VOE: { name: 'Volotea', iata: 'V7', icao: 'VOE' },
  AXM: { name: 'AirAsia', iata: 'AK', icao: 'AXM' },
  TUR: { name: 'Turkish Airlines', iata: 'TK', icao: 'TUR' },
  ISS: { name: 'Meridiana', iata: 'IG', icao: 'ISS' },
  TAP: { name: 'TAP Air Portugal', iata: 'TP', icao: 'TAP' },
  IBE: { name: 'Iberia', iata: 'IB', icao: 'IBE' },
  VLG: { name: 'Vueling Airlines', iata: 'VY', icao: 'VLG' },
  SVA: { name: 'Saudi Arabian Airlines', iata: 'SV', icao: 'SVA' },
  ETH: { name: 'Ethiopian Airlines', iata: 'ET', icao: 'ETH' },
  KQA: { name: 'Kenya Airways', iata: 'KQ', icao: 'KQA' },
  AIC: { name: 'Air India', iata: 'AI', icao: 'AIC' },
  IGO: { name: 'IndiGo', iata: '6E', icao: 'IGO' },
  VOI: { name: 'Vistara', iata: 'UK', icao: 'VOI' },
  AVA: { name: 'Avianca', iata: 'AV', icao: 'AVA' },
  GLO: { name: 'Gol Transportes Aéreos', iata: 'G3', icao: 'GLO' },
  TAM: { name: 'LATAM Airlines', iata: 'JJ', icao: 'TAM' },
  LAN: { name: 'LATAM Airlines Chile', iata: 'LA', icao: 'LAN' },
  AMX: { name: 'Aeromexico', iata: 'AM', icao: 'AMX' },
  WJA: { name: 'WestJet', iata: 'WS', icao: 'WJA' },
  ACA: { name: 'Air Canada', iata: 'AC', icao: 'ACA' },
  QFA: { name: 'Qantas', iata: 'QF', icao: 'QFA' },
  ANZ: { name: 'Air New Zealand', iata: 'NZ', icao: 'ANZ' },
  FIN: { name: 'Finnair', iata: 'AY', icao: 'FIN' },
  SAS: { name: 'Scandinavian Airlines', iata: 'SK', icao: 'SAS' },
  NOZ: { name: 'Norwegian Air Shuttle', iata: 'DY', icao: 'NOZ' },
  AUI: { name: 'Ukraine International Airlines', iata: 'PS', icao: 'AUI' },
  LOT: { name: 'LOT Polish Airlines', iata: 'LO', icao: 'LOT' },
  CSA: { name: 'Czech Airlines', iata: 'OK', icao: 'CSA' },
  ROM: { name: 'TAROM', iata: 'RO', icao: 'ROM' },
  BEL: { name: 'Brussels Airlines', iata: 'SN', icao: 'BEL' },
  AZA: { name: 'Alitalia', iata: 'AZ', icao: 'AZA' },
  WZZ: { name: 'Wizz Air', iata: 'W6', icao: 'WZZ' },
  FDB: { name: 'flydubai', iata: 'FZ', icao: 'FDB' },
  AXB: { name: 'Air Arabia', iata: 'G9', icao: 'AXB' },
  OAL: { name: 'Olympic Air', iata: 'OA', icao: 'OAL' },
  HVN: { name: 'Vietnam Airlines', iata: 'VN', icao: 'HVN' },
  PAL: { name: 'Philippine Airlines', iata: 'PR', icao: 'PAL' },
  KAL: { name: 'Korean Air', iata: 'KE', icao: 'KAL' },
  AAR: { name: 'Asiana Airlines', iata: 'OZ', icao: 'AAR' },
  EVA: { name: 'EVA Air', iata: 'BR', icao: 'EVA' },
  CAL: { name: 'China Airlines', iata: 'CI', icao: 'CAL' },
  HDA: { name: 'Hong Kong Express', iata: 'UO', icao: 'HDA' },
  FDX: { name: 'FedEx Express', iata: 'FX', icao: 'FDX' },
  UPS: { name: 'UPS Airlines', iata: '5X', icao: 'UPS' },
  GTI: { name: 'Atlas Air', iata: '5Y', icao: 'GTI' },
  CLX: { name: 'Cargolux', iata: 'CV', icao: 'CLX' },
};

export function guessAirlineFromCallsign(callsign: string | null): { name: string; iata: string; icao: string } | null {
  if (!callsign) return null;
  const prefix = callsign.substring(0, 3).toUpperCase();
  return AIRLINE_MAP[prefix] ?? null;
}

// Well-known airports for origin/destination display
export const AIRPORT_MAP: Record<string, { name: string; city: string; country: string; lat: number; lng: number }> = {
  KJFK: { name: 'John F. Kennedy International', city: 'New York', country: 'USA', lat: 40.6413, lng: -73.7781 },
  KLAX: { name: 'Los Angeles International', city: 'Los Angeles', country: 'USA', lat: 33.9425, lng: -118.4081 },
  KORD: { name: "O'Hare International", city: 'Chicago', country: 'USA', lat: 41.9742, lng: -87.9073 },
  KATL: { name: 'Hartsfield–Jackson Atlanta International', city: 'Atlanta', country: 'USA', lat: 33.6367, lng: -84.4281 },
  KDFW: { name: 'Dallas/Fort Worth International', city: 'Dallas', country: 'USA', lat: 32.8998, lng: -97.0403 },
  KDEN: { name: 'Denver International', city: 'Denver', country: 'USA', lat: 39.8561, lng: -104.6737 },
  KSFO: { name: 'San Francisco International', city: 'San Francisco', country: 'USA', lat: 37.6213, lng: -122.379 },
  KMIA: { name: 'Miami International', city: 'Miami', country: 'USA', lat: 25.7959, lng: -80.287 },
  KBOS: { name: 'Boston Logan International', city: 'Boston', country: 'USA', lat: 42.3656, lng: -71.0096 },
  KLAS: { name: 'Harry Reid International', city: 'Las Vegas', country: 'USA', lat: 36.0840, lng: -115.1537 },
  EGLL: { name: 'London Heathrow', city: 'London', country: 'UK', lat: 51.4775, lng: -0.4614 },
  EGKK: { name: 'London Gatwick', city: 'London', country: 'UK', lat: 51.1481, lng: -0.1903 },
  LFPG: { name: 'Charles de Gaulle International', city: 'Paris', country: 'France', lat: 49.0097, lng: 2.5479 },
  EDDF: { name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', lat: 50.0379, lng: 8.5622 },
  EHAM: { name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'Netherlands', lat: 52.3086, lng: 4.7639 },
  LEMD: { name: 'Adolfo Suárez Madrid-Barajas', city: 'Madrid', country: 'Spain', lat: 40.4719, lng: -3.5626 },
  LIRF: { name: 'Leonardo da Vinci–Fiumicino', city: 'Rome', country: 'Italy', lat: 41.8003, lng: 12.2389 },
  OMDB: { name: 'Dubai International', city: 'Dubai', country: 'UAE', lat: 25.2532, lng: 55.3657 },
  VHHH: { name: 'Hong Kong International', city: 'Hong Kong', country: 'China', lat: 22.3080, lng: 113.9185 },
  RJTT: { name: 'Tokyo Haneda', city: 'Tokyo', country: 'Japan', lat: 35.5494, lng: 139.7798 },
  RJAA: { name: 'Tokyo Narita', city: 'Tokyo', country: 'Japan', lat: 35.7647, lng: 140.3864 },
  YSSY: { name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'Australia', lat: -33.9461, lng: 151.1772 },
  YMML: { name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia', lat: -37.6690, lng: 144.8410 },
  WSSS: { name: 'Singapore Changi', city: 'Singapore', country: 'Singapore', lat: 1.3644, lng: 103.9915 },
  ZBAA: { name: 'Beijing Capital International', city: 'Beijing', country: 'China', lat: 40.0799, lng: 116.6031 },
  ZSPD: { name: 'Shanghai Pudong International', city: 'Shanghai', country: 'China', lat: 31.1443, lng: 121.8083 },
  VIAR: { name: 'Sri Guru Ram Dass Jee International', city: 'Amritsar', country: 'India', lat: 31.7096, lng: 74.7973 },
  VIDP: { name: 'Indira Gandhi International', city: 'New Delhi', country: 'India', lat: 28.5562, lng: 77.1000 },
  VABB: { name: 'Chhatrapati Shivaji International', city: 'Mumbai', country: 'India', lat: 19.0896, lng: 72.8656 },
  OEDF: { name: 'King Fahd International', city: 'Dammam', country: 'Saudi Arabia', lat: 26.4712, lng: 49.7979 },
  OERK: { name: 'King Khaled International', city: 'Riyadh', country: 'Saudi Arabia', lat: 24.9578, lng: 46.6989 },
  HAAB: { name: 'Bole International Airport', city: 'Addis Ababa', country: 'Ethiopia', lat: 8.9779, lng: 38.7993 },
  FACT: { name: 'Cape Town International', city: 'Cape Town', country: 'South Africa', lat: -33.9648, lng: 18.6017 },
  HKJK: { name: 'Jomo Kenyatta International', city: 'Nairobi', country: 'Kenya', lat: -1.3192, lng: 36.9275 },
  SAEZ: { name: 'Ministro Pistarini International', city: 'Buenos Aires', country: 'Argentina', lat: -34.8222, lng: -58.5358 },
  SBGR: { name: 'São Paulo/Guarulhos International', city: 'São Paulo', country: 'Brazil', lat: -23.4356, lng: -46.4731 },
  MMMX: { name: 'Mexico City International', city: 'Mexico City', country: 'Mexico', lat: 19.4363, lng: -99.0721 },
  CYYZ: { name: 'Toronto Pearson International', city: 'Toronto', country: 'Canada', lat: 43.6777, lng: -79.6248 },
  CYVR: { name: 'Vancouver International', city: 'Vancouver', country: 'Canada', lat: 49.1967, lng: -123.1815 },
};
