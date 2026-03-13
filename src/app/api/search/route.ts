import { NextRequest, NextResponse } from 'next/server';
import { parseStateVector, filterValidFlights, enrichFlight, guessAirlineFromCallsign } from '@/lib/opensky';
import { buildFlightDetails } from '@/lib/aviation';
import { EnrichedFlight } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const qLower = q.toLowerCase();

  try {
    // Check if query looks like an ICAO24 (6 hex chars)
    const isIcao24 = /^[0-9a-f]{6}$/i.test(q);
    // Looks like a callsign
    const isCallsign = /^[a-z0-9]{3,8}$/i.test(q);

    let url = 'https://opensky-network.org/api/states/all';

    // For specific ICAO24 lookups, use targeted endpoint
    if (isIcao24) {
      url += `?icao24=${q.toLowerCase()}`;
    }

    const headers: HeadersInit = {};
    if (process.env.OPENSKY_USERNAME && process.env.OPENSKY_PASSWORD) {
      headers.Authorization = `Basic ${Buffer.from(
        `${process.env.OPENSKY_USERNAME}:${process.env.OPENSKY_PASSWORD}`
      ).toString('base64')}`;
    }

    const res = await fetch(url, { headers, next: { revalidate: 10 } });

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = await res.json();
    if (!data.states) return NextResponse.json({ results: [] });

    const states = data.states.map(parseStateVector);
    const valid = filterValidFlights(states);

    // Score and filter results
    const results: (EnrichedFlight & { _score: number })[] = [];

    for (const state of valid) {
      let score = 0;
      const callsign = (state.callsign ?? '').toLowerCase();
      const icao24 = state.icao24.toLowerCase();
      const country = state.origin_country.toLowerCase();
      const airline = guessAirlineFromCallsign(state.callsign);
      const airlineName = (airline?.name ?? '').toLowerCase();

      if (icao24 === qLower) score += 100;
      else if (icao24.startsWith(qLower)) score += 70;
      else if (icao24.includes(qLower)) score += 40;

      if (callsign === qLower) score += 90;
      else if (callsign.startsWith(qLower)) score += 60;
      else if (callsign.includes(qLower)) score += 30;

      if (airlineName.includes(qLower)) score += 50;
      if (country.includes(qLower)) score += 20;

      // Airline IATA/ICAO match
      if (airline) {
        if (airline.iata.toLowerCase() === qLower || airline.icao.toLowerCase() === qLower) score += 80;
      }

      if (score > 0) {
        const enriched = enrichFlight(state);
        enriched.details = buildFlightDetails(state);
        results.push({ ...enriched, _score: score });
      }

      if (results.length >= 50) break;
    }

    // Sort by score descending, return top 20
    results.sort((a, b) => b._score - a._score);
    const top20 = results.slice(0, 20).map(({ _score: _, ...rest }) => rest);

    return NextResponse.json({ results: top20, query: q });
  } catch (err) {
    console.error('[/api/search] Error:', err);
    return NextResponse.json({ results: [], error: true });
  }
}
