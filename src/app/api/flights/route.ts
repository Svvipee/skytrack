import { NextResponse } from 'next/server';
import { fetchAllStates, parseStateVector, filterValidFlights, enrichFlight } from '@/lib/opensky';
import { buildFlightDetails } from '@/lib/aviation';
import { EnrichedFlight } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Cache between requests to avoid hammering OpenSky
let cache: { data: EnrichedFlight[]; time: number; fetchTime: number } | null = null;
const CACHE_TTL = 12_000; // 12 seconds (OpenSky updates ~10s)
const MAX_FLIGHTS = 6000;

export async function GET() {
  try {
    const now = Date.now();

    // Return cached data if fresh enough
    if (cache && now - cache.fetchTime < CACHE_TTL) {
      return NextResponse.json({ flights: cache.data, time: cache.time, cached: true });
    }

    const response = await fetchAllStates();

    if (!response.states) {
      if (cache) {
        return NextResponse.json({ flights: cache.data, time: cache.time, cached: true, stale: true });
      }
      return NextResponse.json({ flights: [], time: response.time, cached: false });
    }

    // Parse and filter
    const rawStates = response.states.map(parseStateVector);
    const validStates = filterValidFlights(rawStates).slice(0, MAX_FLIGHTS);

    // Enrich with computed fields + guessed airline info
    const enrichedFlights: EnrichedFlight[] = validStates.map((state) => {
      const enriched = enrichFlight(state);
      enriched.details = buildFlightDetails(state);
      return enriched;
    });

    cache = { data: enrichedFlights, time: response.time, fetchTime: now };

    return NextResponse.json({
      flights: enrichedFlights,
      time: response.time,
      count: enrichedFlights.length,
      cached: false,
    });
  } catch (err) {
    console.error('[/api/flights] Error:', err);

    // Return stale cache on error
    if (cache) {
      return NextResponse.json({ flights: cache.data, time: cache.time, cached: true, error: true });
    }

    return NextResponse.json(
      { error: 'Failed to fetch flight data', flights: [], time: 0 },
      { status: 502 }
    );
  }
}
