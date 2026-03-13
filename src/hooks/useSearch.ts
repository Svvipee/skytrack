'use client';
import { useCallback, useRef } from 'react';
import { useFlightStore, useUIStore } from '@/store';
import { EnrichedFlight } from '@/types';

export function useSearch() {
  const {
    flights,
    searchQuery,
    searchResults,
    isSearching,
    setSearchQuery,
    setSearchResults,
    setIsSearching,
    setSelectedFlight,
  } = useFlightStore();

  const { setSearchPanelOpen, setMapCenter } = useUIStore();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const localSearch = useCallback(
    (query: string): EnrichedFlight[] => {
      if (!query.trim()) return [];
      const q = query.toLowerCase().trim();

      return flights
        .filter((f) => {
          const callsign = (f.callsign ?? '').toLowerCase();
          const icao24 = f.icao24.toLowerCase();
          const country = f.origin_country.toLowerCase();
          const airline = f.details?.airline?.toLowerCase() ?? '';
          const flightNum = f.details?.flightNumber?.toLowerCase() ?? '';
          const reg = f.details?.registration?.toLowerCase() ?? '';
          const model = f.details?.aircraftModel?.toLowerCase() ?? '';

          return (
            callsign.includes(q) ||
            icao24.includes(q) ||
            country.includes(q) ||
            airline.includes(q) ||
            flightNum.includes(q) ||
            reg.includes(q) ||
            model.includes(q)
          );
        })
        .slice(0, 20);
    },
    [flights]
  );

  const search = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      // Immediate local filter
      const localResults = localSearch(query);
      setSearchResults(localResults);
      setSearchPanelOpen(true);

      // Debounced API search for deeper results
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          if (res.ok) {
            const data: { results: EnrichedFlight[] } = await res.json();
            if (data.results.length > 0) {
              setSearchResults(data.results);
            }
          }
        } catch {
          // keep local results
        } finally {
          setIsSearching(false);
        }
      }, 400);
    },
    [localSearch, setSearchQuery, setSearchResults, setIsSearching, setSearchPanelOpen]
  );

  const selectResult = useCallback(
    (flight: EnrichedFlight) => {
      setSelectedFlight(flight);
      setSearchPanelOpen(false);
      if (flight.latitude && flight.longitude) {
        setMapCenter({ lat: flight.latitude, lng: flight.longitude, altitude: 2.5 });
      }
    },
    [setSelectedFlight, setSearchPanelOpen, setMapCenter]
  );

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchPanelOpen(false);
  }, [setSearchQuery, setSearchResults, setSearchPanelOpen]);

  return {
    searchQuery,
    searchResults,
    isSearching,
    search,
    selectResult,
    clearSearch,
  };
}
