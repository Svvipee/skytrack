import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { EnrichedFlight, SavedFlight, Toast, ThemeConfig } from '@/types';
import { getThemeConfig } from '@/lib/theme';

// ─── Flight Store ─────────────────────────────────────────────────────────────

interface FlightStore {
  flights: EnrichedFlight[];
  selectedFlight: EnrichedFlight | null;
  isLoading: boolean;
  lastUpdate: number | null;
  error: string | null;
  searchQuery: string;
  searchResults: EnrichedFlight[];
  isSearching: boolean;

  setFlights: (flights: EnrichedFlight[]) => void;
  setSelectedFlight: (flight: EnrichedFlight | null) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  setSearchQuery: (q: string) => void;
  setSearchResults: (results: EnrichedFlight[]) => void;
  setIsSearching: (v: boolean) => void;
  updateLastUpdate: () => void;

  // Live update: merge new positions
  mergeLiveFlights: (newFlights: EnrichedFlight[]) => void;
}

export const useFlightStore = create<FlightStore>()((set, get) => ({
  flights: [],
  selectedFlight: null,
  isLoading: false,
  lastUpdate: null,
  error: null,
  searchQuery: '',
  searchResults: [],
  isSearching: false,

  setFlights: (flights) => set({ flights }),
  setSelectedFlight: (flight) => set({ selectedFlight: flight }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSearchResults: (searchResults) => set({ searchResults }),
  setIsSearching: (isSearching) => set({ isSearching }),
  updateLastUpdate: () => set({ lastUpdate: Date.now() }),

  mergeLiveFlights: (newFlights) => {
    const existing = get().flights;
    const map = new Map(existing.map((f) => [f.icao24, f]));
    for (const f of newFlights) {
      map.set(f.icao24, f);
    }
    set({ flights: Array.from(map.values()) });
  },
}));

// ─── Collections Store ────────────────────────────────────────────────────────

interface CollectionsStore {
  collections: SavedFlight[];
  isPanelOpen: boolean;

  addToCollection: (flight: EnrichedFlight, userId?: string) => boolean;
  removeFromCollection: (icao24: string) => void;
  isInCollection: (icao24: string) => boolean;
  updateSnapshot: (icao24: string, snapshot: EnrichedFlight) => void;
  getSavedFlight: (icao24: string) => SavedFlight | undefined;
  togglePanel: () => void;
  setPanelOpen: (v: boolean) => void;
  clearAll: () => void;
}

export const useCollectionsStore = create<CollectionsStore>()(
  persist(
    (set, get) => ({
      collections: [],
      isPanelOpen: false,

      addToCollection: (flight, userId) => {
        if (get().isInCollection(flight.icao24)) return false;
        const saved: SavedFlight = {
          id: `${flight.icao24}-${Date.now()}`,
          icao24: flight.icao24,
          callsign: flight.callsign ?? flight.icao24,
          savedAt: new Date().toISOString(),
          snapshot: flight,
          userId,
        };
        set((s) => ({ collections: [...s.collections, saved] }));
        return true;
      },

      removeFromCollection: (icao24) => {
        set((s) => ({
          collections: s.collections.filter((f) => f.icao24 !== icao24),
        }));
      },

      isInCollection: (icao24) => {
        return get().collections.some((f) => f.icao24 === icao24);
      },

      updateSnapshot: (icao24, snapshot) => {
        set((s) => ({
          collections: s.collections.map((f) =>
            f.icao24 === icao24 ? { ...f, snapshot } : f
          ),
        }));
      },

      getSavedFlight: (icao24) => {
        return get().collections.find((f) => f.icao24 === icao24);
      },

      togglePanel: () => set((s) => ({ isPanelOpen: !s.isPanelOpen })),
      setPanelOpen: (isPanelOpen) => set({ isPanelOpen }),
      clearAll: () => set({ collections: [] }),
    }),
    {
      name: 'flight-tracker-collections',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} }
      ),
    }
  )
);

// ─── UI Store ─────────────────────────────────────────────────────────────────

interface UIStore {
  theme: ThemeConfig;
  toasts: Toast[];
  isAuthModalOpen: boolean;
  isSearchPanelOpen: boolean;
  globeAutoRotate: boolean;
  mapCenter: { lat: number; lng: number; altitude: number } | null;

  setTheme: (theme: ThemeConfig) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  setAuthModalOpen: (v: boolean) => void;
  setSearchPanelOpen: (v: boolean) => void;
  setGlobeAutoRotate: (v: boolean) => void;
  setMapCenter: (c: UIStore['mapCenter']) => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  theme: getThemeConfig(new Date().getHours()),
  toasts: [],
  isAuthModalOpen: false,
  isSearchPanelOpen: false,
  globeAutoRotate: true,
  mapCenter: null,

  setTheme: (theme) => set({ theme }),

  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, toast.duration ?? 3500);
  },

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setAuthModalOpen: (isAuthModalOpen) => set({ isAuthModalOpen }),
  setSearchPanelOpen: (isSearchPanelOpen) => set({ isSearchPanelOpen }),
  setGlobeAutoRotate: (globeAutoRotate) => set({ globeAutoRotate }),
  setMapCenter: (mapCenter) => set({ mapCenter }),
}));
