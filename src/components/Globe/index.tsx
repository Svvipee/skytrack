'use client';
import dynamic from 'next/dynamic';
import { GlobeLoader } from '@/components/UI/LoadingSpinner';
import type { ThemeConfig, EnrichedFlight, SavedFlight } from '@/types';

// Dynamically import — avoids SSR/WebGL issues
const GlobeComponent = dynamic(() => import('./GlobeComponent'), {
  ssr: false,
  loading: () => <GlobeLoader />,
});

interface GlobeWrapperProps {
  flights: EnrichedFlight[];
  savedFlights: SavedFlight[];
  selectedFlight: EnrichedFlight | null;
  theme: ThemeConfig;
  mapCenter: { lat: number; lng: number; altitude: number } | null;
  onFlightClick: (flight: EnrichedFlight) => void;
  autoRotate: boolean;
}

export function Globe(props: GlobeWrapperProps) {
  return <GlobeComponent {...props} />;
}
