import { NextRequest, NextResponse } from 'next/server';
import { enrichFlight, parseStateVector, fetchFlightsByAircraft } from '@/lib/opensky';
import { buildFlightDetails, enrichWithAviationStack } from '@/lib/aviation';
import { EnrichedFlight } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { icao24: string } }
) {
  const { icao24 } = params;

  try {
    // Fetch current state for this specific aircraft
    const url = `https://opensky-network.org/api/states/all?icao24=${icao24.toLowerCase()}`;
    const headers: HeadersInit = {};
    if (process.env.OPENSKY_USERNAME && process.env.OPENSKY_PASSWORD) {
      headers.Authorization = `Basic ${Buffer.from(
        `${process.env.OPENSKY_USERNAME}:${process.env.OPENSKY_PASSWORD}`
      ).toString('base64')}`;
    }

    const res = await fetch(url, { headers });
    const data = await res.json();

    let enriched: EnrichedFlight | null = null;

    if (data?.states?.[0]) {
      const state = parseStateVector(data.states[0]);
      enriched = enrichFlight(state);
      enriched.details = buildFlightDetails(state);
    }

    // Try to enrich with AviationStack
    const callsign = enriched?.callsign;
    if (callsign) {
      const extra = await enrichWithAviationStack(callsign);
      if (enriched && enriched.details) {
        enriched.details = { ...enriched.details, ...extra };
      }
    }

    // Fetch recent flight history (last 24h)
    let history: unknown[] = [];
    try {
      const end = Math.floor(Date.now() / 1000);
      const begin = end - 86400;
      history = await fetchFlightsByAircraft(icao24, begin, end);
    } catch {
      history = [];
    }

    return NextResponse.json({ flight: enriched, history });
  } catch (err) {
    console.error(`[/api/flights/${icao24}] Error:`, err);
    return NextResponse.json({ error: 'Failed to enrich flight data', flight: null }, { status: 502 });
  }
}
