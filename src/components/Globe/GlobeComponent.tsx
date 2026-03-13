'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import type { ThemeConfig, EnrichedFlight, SavedFlight } from '@/types';
import { GlobeLoader } from '@/components/UI/LoadingSpinner';

interface GlobeProps {
  flights: EnrichedFlight[];
  savedFlights: SavedFlight[];
  selectedFlight: EnrichedFlight | null;
  theme: ThemeConfig;
  mapCenter: { lat: number; lng: number; altitude: number } | null;
  onFlightClick: (flight: EnrichedFlight) => void;
  autoRotate: boolean;
}

function altColor(altM: number | null): string {
  if (altM === null || altM <= 0) return 'rgba(148,163,184,0.7)';
  const ft = altM * 3.28084;
  if (ft < 5000) return 'rgba(34,197,94,0.9)';
  if (ft < 15000) return 'rgba(132,204,22,0.9)';
  if (ft < 25000) return 'rgba(234,179,8,0.9)';
  if (ft < 35000) return 'rgba(249,115,22,0.9)';
  return 'rgba(239,68,68,0.9)';
}

function createHtmlMarker(flight: EnrichedFlight, isSelected: boolean, isSaved: boolean): HTMLElement {
  const heading = flight.true_track ?? 0;
  const size = isSelected ? 28 : isSaved ? 22 : 16;
  const color = isSelected ? '#22d3ee' : isSaved ? '#fbbf24' : '#f1f5f9';
  const glowColor = isSelected ? '#22d3ee' : isSaved ? '#fbbf24' : 'rgba(255,255,255,0.4)';
  const glowPx = isSelected ? 8 : isSaved ? 5 : 2;
  const div = document.createElement('div');
  div.style.cssText = `transform:rotate(${heading}deg);width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;cursor:pointer;filter:drop-shadow(0 0 ${glowPx}px ${glowColor});`;
  div.innerHTML = `<svg viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><path d="M21 15.994V17l-9 3-9-3V15.994L8.006 17.5 12 16l3.994 1.5L21 15.994zM12 0L3 14h4.5v7h9v-7H21L12 0z"/></svg>`;
  return div;
}

export default function GlobeComponent({ flights, savedFlights, selectedFlight, theme, mapCenter, onFlightClick, autoRotate }: GlobeProps) {
  const globeEl = useRef<any>(null);
  const [GlobeLib, setGlobeLib] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: typeof window !== 'undefined' ? window.innerWidth : 1280, h: typeof window !== 'undefined' ? window.innerHeight : 800 });

  // Load react-globe.gl dynamically
  useEffect(() => {
    import('react-globe.gl').then((mod) => setGlobeLib(() => mod.default));
  }, []);

  // Track container size
  useEffect(() => {
    const updateDims = () => {
      if (containerRef.current) {
        setDims({ w: containerRef.current.offsetWidth, h: containerRef.current.offsetHeight });
      }
    };
    updateDims();
    const ro = new ResizeObserver(updateDims);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', updateDims);
    return () => { ro.disconnect(); window.removeEventListener('resize', updateDims); };
  }, []);

  // Fly to selected flight
  useEffect(() => {
    if (!globeEl.current || !selectedFlight?.latitude || !selectedFlight?.longitude) return;
    globeEl.current.pointOfView({ lat: selectedFlight.latitude, lng: selectedFlight.longitude, altitude: 1.2 }, 1000);
    if (globeEl.current.controls) globeEl.current.controls().autoRotate = false;
  }, [selectedFlight?.icao24]); // eslint-disable-line

  // Override map center
  useEffect(() => {
    if (!globeEl.current || !mapCenter) return;
    globeEl.current.pointOfView(mapCenter, 1200);
  }, [mapCenter]);

  // Toggle auto-rotate
  useEffect(() => {
    if (!globeEl.current?.controls) return;
    const c = globeEl.current.controls();
    c.autoRotate = autoRotate;
    c.autoRotateSpeed = 0.3;
  }, [autoRotate]);

  const savedIcaos = new Set(savedFlights.map((s) => s.icao24));
  const selIcao = selectedFlight?.icao24;

  const htmlFlights = flights.filter((f) => f.icao24 === selIcao || savedIcaos.has(f.icao24));
  const liveIcaos = new Set(flights.map((f) => f.icao24));
  for (const saved of savedFlights) {
    if (!liveIcaos.has(saved.icao24)) htmlFlights.push(saved.snapshot);
  }

  const arcData = savedFlights
    .filter((s) => s.snapshot.details?.origin?.latitude != null && s.snapshot.details?.destination?.latitude != null)
    .map((s) => ({
      startLat: s.snapshot.details!.origin!.latitude,
      startLng: s.snapshot.details!.origin!.longitude,
      endLat: s.snapshot.details!.destination!.latitude,
      endLng: s.snapshot.details!.destination!.longitude,
    }));

  const getHtmlElement = useCallback((d: object) => {
    const f = d as EnrichedFlight;
    return createHtmlMarker(f, f.icao24 === selIcao, savedIcaos.has(f.icao24));
  }, [selIcao]); // eslint-disable-line

  const getPointColor = useCallback((d: object) => altColor((d as EnrichedFlight).baro_altitude), []);
  const getPointRadius = useCallback((d: object) => {
    const f = d as EnrichedFlight;
    return f.icao24 === selIcao ? 0.7 : savedIcaos.has(f.icao24) ? 0.55 : 0.25;
  }, [selIcao]); // eslint-disable-line
  const getPointAlt = useCallback((d: object) => Math.max(0.001, (((d as EnrichedFlight).baro_altitude ?? 0) / 13000) * 0.08), []);

  if (!GlobeLib) return <GlobeLoader />;
  const G = GlobeLib;

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <G
        ref={globeEl}
        width={dims.w}
        height={dims.h}
        // Globe appearance
        globeImageUrl={theme.globeImageUrl}
        backgroundImageUrl={theme.starsVisible ? 'https://unpkg.com/three-globe/example/img/night-sky.png' : ''}
        atmosphereColor={theme.globeAtmosphere}
        atmosphereAltitude={0.18}
        backgroundColor="rgba(0,0,0,0)"
        // Aircraft points
        pointsData={flights}
        pointLat="latitude"
        pointLng="longitude"
        pointAltitude={getPointAlt}
        pointColor={getPointColor}
        pointRadius={getPointRadius}
        pointResolution={4}
        pointsMerge={false}
        onPointClick={(point: object) => onFlightClick(point as EnrichedFlight)}
        onPointHover={(point: object | null) => {
          if (containerRef.current) containerRef.current.style.cursor = point ? 'pointer' : 'grab';
        }}
        // HTML markers (selected + saved)
        htmlElementsData={htmlFlights}
        htmlLat="latitude"
        htmlLng="longitude"
        htmlAltitude={getPointAlt}
        htmlElement={getHtmlElement}
        // Route arcs for saved flights
        arcsData={arcData}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor={() => ['rgba(251,191,36,0)', 'rgba(251,191,36,0.9)', 'rgba(251,191,36,0)']}
        arcDashLength={0.3}
        arcDashGap={0.1}
        arcDashAnimateTime={2000}
        arcStroke={0.5}
        arcAltitudeAutoScale={0.3}
        onGlobeReady={() => {
          if (!globeEl.current) return;
          globeEl.current.pointOfView({ lat: 30, lng: 0, altitude: 2.5 });
          if (globeEl.current.controls) {
            const c = globeEl.current.controls();
            c.autoRotate = autoRotate;
            c.autoRotateSpeed = 0.3;
            c.enableDamping = true;
            c.dampingFactor = 0.1;
          }
        }}
      />
    </div>
  );
}
