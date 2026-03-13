'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useFlightStore } from '@/store';
import { EnrichedFlight } from '@/types';

const REFRESH_INTERVAL = 15_000; // 15 seconds

export function useFlights() {
  const {
    flights,
    setFlights,
    setLoading,
    setError,
    updateLastUpdate,
    selectedFlight,
    setSelectedFlight,
    mergeLiveFlights,
  } = useFlightStore();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchFlights = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/flights', {
        signal: abortRef.current.signal,
        next: { revalidate: 0 },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: { flights: EnrichedFlight[]; time: number } = await res.json();
      mergeLiveFlights(data.flights);
      updateLastUpdate();
      setError(null);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError('Failed to fetch live flight data. Retrying...');
      console.error('[useFlights] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [mergeLiveFlights, updateLastUpdate, setError, setLoading]);

  useEffect(() => {
    setLoading(true);
    fetchFlights();

    intervalRef.current = setInterval(fetchFlights, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchFlights, setLoading]);

  // Auto-update selected flight when new data arrives
  useEffect(() => {
    if (!selectedFlight) return;
    const updated = flights.find((f) => f.icao24 === selectedFlight.icao24);
    if (updated) setSelectedFlight(updated);
  }, [flights, selectedFlight, setSelectedFlight]);

  return { flights, selectedFlight };
}

export function useFlightDetails(icao24: string | null) {
  const { selectedFlight, setSelectedFlight } = useFlightStore();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (!icao24) return;

    const enrich = async () => {
      try {
        const res = await fetch(`/api/flights/${icao24}`);
        if (!res.ok) return;
        const enriched: EnrichedFlight = await res.json();
        if (isMounted.current) {
          setSelectedFlight(enriched);
        }
      } catch {
        // non-fatal
      }
    };

    enrich();
  }, [icao24, setSelectedFlight]);

  return selectedFlight;
}
