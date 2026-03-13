import { FlightState, EnrichedFlight, FlightDetails } from '@/types';
import { guessAirlineFromCallsign, AIRPORT_MAP } from './opensky';

// Extract flight number from callsign (e.g., "AAL123" -> "AA 123")
export function extractFlightNumber(callsign: string | null): string | null {
  if (!callsign) return null;
  const match = callsign.match(/^([A-Z]{2,3})(\d+)([A-Z]?)$/);
  if (!match) return callsign;
  const airline = guessAirlineFromCallsign(callsign);
  const iata = airline?.iata ?? match[1];
  return `${iata}${match[2]}${match[3]}`;
}

// Determine position source label
export function getPositionSource(src: number): string {
  switch (src) {
    case 0: return 'ADS-B';
    case 1: return 'ASTERIX';
    case 2: return 'MLAT';
    case 3: return 'FLARM';
    default: return 'Unknown';
  }
}

// Guess aircraft type from registration prefix (rough heuristic)
export function guessAircraftFromRegistration(reg: string | null): string | null {
  if (!reg) return null;
  // Most airlines don't expose registration in OpenSky's free data,
  // but we keep this for enrichment from other sources
  return null;
}

// Enrich a flight with all available metadata
export function buildFlightDetails(state: FlightState): FlightDetails {
  const airline = guessAirlineFromCallsign(state.callsign);
  const flightNumber = extractFlightNumber(state.callsign);

  return {
    icao24: state.icao24,
    callsign: state.callsign ?? state.icao24,
    flightNumber,
    airline: airline?.name ?? null,
    airlineIata: airline?.iata ?? null,
    airlineIcao: airline?.icao ?? null,
    origin: null,   // enriched from AviationStack if key available
    destination: null,
    departureTime: null,
    arrivalTime: null,
    scheduledDeparture: null,
    scheduledArrival: null,
    status: 'active',
    aircraftModel: null,
    aircraftType: null,
    registration: null,
    age: null,
    imageUrl: null,
  };
}

// Try to enrich with AviationStack (if API key available)
export async function enrichWithAviationStack(
  callsign: string
): Promise<Partial<FlightDetails>> {
  const apiKey = process.env.AVIATIONSTACK_API_KEY;
  if (!apiKey) return {};

  try {
    const url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_icao=${callsign}&limit=1`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return {};

    const data = await res.json();
    const flight = data?.data?.[0];
    if (!flight) return {};

    const originIcao = flight.departure?.icao;
    const destIcao = flight.arrival?.icao;
    const originInfo = originIcao ? AIRPORT_MAP[originIcao] : null;
    const destInfo = destIcao ? AIRPORT_MAP[destIcao] : null;

    return {
      flightNumber: flight.flight?.iata ?? null,
      airline: flight.airline?.name ?? null,
      airlineIata: flight.airline?.iata ?? null,
      airlineIcao: flight.airline?.icao ?? null,
      origin: originInfo
        ? {
            iata: flight.departure?.iata ?? '',
            icao: originIcao,
            name: originInfo.name,
            city: originInfo.city,
            country: originInfo.country,
            latitude: originInfo.lat,
            longitude: originInfo.lng,
            timezone: '',
          }
        : flight.departure?.iata
        ? {
            iata: flight.departure.iata ?? '',
            icao: originIcao ?? '',
            name: flight.departure.airport ?? '',
            city: flight.departure.timezone?.split('/')[1]?.replace('_', ' ') ?? '',
            country: '',
            latitude: 0,
            longitude: 0,
            timezone: flight.departure.timezone ?? '',
          }
        : null,
      destination: destInfo
        ? {
            iata: flight.arrival?.iata ?? '',
            icao: destIcao,
            name: destInfo.name,
            city: destInfo.city,
            country: destInfo.country,
            latitude: destInfo.lat,
            longitude: destInfo.lng,
            timezone: '',
          }
        : flight.arrival?.iata
        ? {
            iata: flight.arrival.iata ?? '',
            icao: destIcao ?? '',
            name: flight.arrival.airport ?? '',
            city: flight.arrival.timezone?.split('/')[1]?.replace('_', ' ') ?? '',
            country: '',
            latitude: 0,
            longitude: 0,
            timezone: flight.arrival.timezone ?? '',
          }
        : null,
      departureTime: flight.departure?.actual ?? flight.departure?.estimated ?? null,
      arrivalTime: flight.arrival?.actual ?? flight.arrival?.estimated ?? null,
      scheduledDeparture: flight.departure?.scheduled ?? null,
      scheduledArrival: flight.arrival?.scheduled ?? null,
      status: mapFlightStatus(flight.flight_status),
      aircraftModel: flight.aircraft?.iata ?? null,
      aircraftType: flight.aircraft?.icao ?? null,
      registration: flight.aircraft?.registration ?? null,
    };
  } catch {
    return {};
  }
}

function mapFlightStatus(status: string): FlightDetails['status'] {
  switch (status?.toLowerCase()) {
    case 'scheduled': return 'scheduled';
    case 'active':
    case 'en-route': return 'active';
    case 'landed': return 'landed';
    case 'cancelled': return 'cancelled';
    default: return 'unknown';
  }
}

// Calculate great-circle distance in km
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Estimate ETA if we have destination coordinates and current speed
export function estimateETA(
  curLat: number, curLon: number,
  destLat: number, destLon: number,
  speedKts: number
): string | null {
  if (!speedKts || speedKts <= 0) return null;
  const distKm = haversineKm(curLat, curLon, destLat, destLon);
  const speedKmh = speedKts * 1.852;
  const hoursLeft = distKm / speedKmh;
  const eta = new Date(Date.now() + hoursLeft * 3600 * 1000);
  return eta.toISOString();
}
