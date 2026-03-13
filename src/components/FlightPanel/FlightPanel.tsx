'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Bookmark, BookmarkCheck, Plane, Navigation2,
  Gauge, ArrowUp, ArrowDown, Minus, Globe2, Radio,
  Layers, Hash, Clock, MapPin, ExternalLink
} from 'lucide-react';
import { useFlightStore, useCollectionsStore, useUIStore } from '@/store';
import { Button } from '@/components/UI/Button';
import { GlassPanel } from '@/components/UI/GlassPanel';
import {
  formatAltitude, formatSpeed, formatHeading,
  formatVerticalRate, getTimeSinceContact
} from '@/lib/theme';
import { EnrichedFlight } from '@/types';
import { useSession } from 'next-auth/react';

export function FlightPanel() {
  const { selectedFlight, setSelectedFlight } = useFlightStore();
  const { addToCollection, removeFromCollection, isInCollection } = useCollectionsStore();
  const { addToast, setAuthModalOpen } = useUIStore();
  const { data: session } = useSession();
  const [isEnriching, setIsEnriching] = useState(false);
  const [enriched, setEnriched] = useState<EnrichedFlight | null>(null);

  const flight = enriched ?? selectedFlight;
  const saved = flight ? isInCollection(flight.icao24) : false;

  useEffect(() => {
    if (!selectedFlight) { setEnriched(null); return; }

    setEnriched(null);
    setIsEnriching(true);

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/flights/${selectedFlight.icao24}`);
        if (res.ok) {
          const data = await res.json();
          if (data.flight) setEnriched(data.flight);
        }
      } catch { /* ignore */ } finally {
        setIsEnriching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [selectedFlight?.icao24]);

  const handleSave = () => {
    if (!flight) return;
    if (!session) {
      setAuthModalOpen(true);
      addToast({ type: 'info', message: 'Sign in to save flights to your collection' });
      return;
    }
    if (saved) {
      removeFromCollection(flight.icao24);
      addToast({ type: 'info', message: `Removed ${flight.callsign ?? flight.icao24} from collection` });
    } else {
      const ok = addToCollection(flight, (session.user as { id?: string })?.id);
      if (ok) addToast({ type: 'success', message: `Saved ${flight.callsign ?? flight.icao24} to collection ✈` });
      else addToast({ type: 'warning', message: 'Already in your collection' });
    }
  };

  const vertRate = flight?.vertical_rate ?? 0;
  const vertIcon = vertRate > 1 ? <ArrowUp className="w-3.5 h-3.5 text-green-400" /> :
    vertRate < -1 ? <ArrowDown className="w-3.5 h-3.5 text-red-400" /> :
    <Minus className="w-3.5 h-3.5 text-gray-400" />;

  return (
    <AnimatePresence>
      {selectedFlight && (
        <motion.div
          key="flight-panel"
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          className="fixed right-4 top-20 bottom-4 z-30 w-[340px] sm:w-[380px] flex flex-col pointer-events-auto"
        >
          <GlassPanel className="flex-1 flex flex-col overflow-hidden shadow-panel">
            {/* Header */}
            <div className="flex items-start justify-between p-4 border-b border-[var(--color-border)]">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)]/15 flex items-center justify-center flex-shrink-0">
                    <Plane className="w-5 h-5 text-[var(--color-primary)]"
                      style={{ transform: `rotate(${(flight?.true_track ?? 0) - 90}deg)` }}
                    />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[var(--color-text)] font-mono leading-tight">
                      {flight?.callsign ?? flight?.icao24 ?? '—'}
                    </h2>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {flight?.details?.flightNumber && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-mono">
                          {flight.details.flightNumber}
                        </span>
                      )}
                      {!flight?.on_ground && (
                        <span className="flex items-center gap-1 text-[10px] text-green-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          Airborne
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Airline */}
                {flight?.details?.airline && (
                  <p className="mt-1.5 text-xs text-[var(--color-text-muted)] pl-11">
                    {flight.details.airline}
                    {flight.details.airlineIata ? ` (${flight.details.airlineIata})` : ''}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={handleSave}
                  className={`p-2 rounded-xl transition-all duration-200 border ${
                    saved
                      ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]/30 text-[var(--color-primary)]'
                      : 'bg-white/5 border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/10'
                  }`}
                  title={saved ? 'Remove from collection' : 'Save to collection'}
                >
                  {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setSelectedFlight(null)}
                  className="p-2 rounded-xl bg-white/5 border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/10 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Route */}
              {(flight?.details?.origin || flight?.details?.destination) && (
                <div className="p-4 border-b border-[var(--color-border)]">
                  <div className="flex items-center gap-3">
                    <div className="text-center flex-1">
                      <p className="text-xl font-bold font-mono text-[var(--color-text)]">
                        {flight.details.origin?.iata ?? '???'}
                      </p>
                      <p className="text-[10px] text-[var(--color-text-muted)] truncate">
                        {flight.details.origin?.city ?? ''}
                      </p>
                      {flight.details.departureTime && (
                        <p className="text-[10px] text-[var(--color-text-muted)] font-mono">
                          {new Date(flight.details.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-center">
                        <div className="flex-1 h-px bg-[var(--color-border)]" />
                        <Plane className="w-3.5 h-3.5 text-[var(--color-accent)] mx-1.5" />
                        <div className="flex-1 h-px bg-[var(--color-border)]" />
                      </div>
                      <span className="text-[9px] text-[var(--color-text-muted)] font-mono">
                        {flight.details.aircraftModel ?? ''}
                      </span>
                    </div>

                    <div className="text-center flex-1">
                      <p className="text-xl font-bold font-mono text-[var(--color-text)]">
                        {flight.details.destination?.iata ?? '???'}
                      </p>
                      <p className="text-[10px] text-[var(--color-text-muted)] truncate">
                        {flight.details.destination?.city ?? ''}
                      </p>
                      {flight.details.arrivalTime && (
                        <p className="text-[10px] text-[var(--color-text-muted)] font-mono">
                          {new Date(flight.details.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Live Data Grid */}
              <div className="p-4 border-b border-[var(--color-border)]">
                <p className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase tracking-widest mb-3">
                  Live Data
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <DataCard
                    icon={<Gauge className="w-3.5 h-3.5" />}
                    label="Altitude"
                    value={formatAltitude(flight?.baro_altitude ?? null)}
                    className={
                      (flight?.baro_altitude ?? 0) > 10000 ? 'text-orange-400' : 'text-green-400'
                    }
                  />
                  <DataCard
                    icon={<Navigation2 className="w-3.5 h-3.5" />}
                    label="Ground Speed"
                    value={formatSpeed(flight?.velocity ?? null)}
                  />
                  <DataCard
                    icon={<div className="flex">{vertIcon}</div>}
                    label="Vertical Rate"
                    value={formatVerticalRate(flight?.vertical_rate ?? null)}
                    className={
                      vertRate > 1 ? 'text-green-400' : vertRate < -1 ? 'text-red-400' : 'text-gray-400'
                    }
                  />
                  <DataCard
                    icon={<Navigation2 className="w-3.5 h-3.5" />}
                    label="Heading"
                    value={formatHeading(flight?.true_track ?? null)}
                  />
                </div>
              </div>

              {/* Aircraft Info */}
              <div className="p-4 border-b border-[var(--color-border)] space-y-2.5">
                <p className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase tracking-widest mb-3">
                  Aircraft
                </p>
                <InfoRow icon={<Hash />} label="ICAO24" value={flight?.icao24?.toUpperCase() ?? '—'} mono />
                <InfoRow icon={<Radio />} label="Callsign" value={flight?.callsign ?? '—'} mono />
                {flight?.details?.registration && (
                  <InfoRow icon={<Layers />} label="Registration" value={flight.details.registration} mono />
                )}
                {flight?.details?.aircraftModel && (
                  <InfoRow icon={<Plane />} label="Aircraft Type" value={flight.details.aircraftModel} />
                )}
                <InfoRow icon={<Globe2 />} label="Country" value={flight?.origin_country ?? '—'} />
                {flight?.squawk && (
                  <InfoRow icon={<Radio />} label="Squawk" value={flight.squawk} mono />
                )}
              </div>

              {/* Position */}
              <div className="p-4 border-b border-[var(--color-border)] space-y-2.5">
                <p className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase tracking-widest mb-3">
                  Position
                </p>
                <InfoRow
                  icon={<MapPin />}
                  label="Latitude"
                  value={flight?.latitude != null ? flight.latitude.toFixed(4) + '°' : '—'}
                  mono
                />
                <InfoRow
                  icon={<MapPin />}
                  label="Longitude"
                  value={flight?.longitude != null ? flight.longitude.toFixed(4) + '°' : '—'}
                  mono
                />
                {flight?.geo_altitude && (
                  <InfoRow
                    icon={<Gauge />}
                    label="Geo Altitude"
                    value={formatAltitude(flight.geo_altitude)}
                    mono
                  />
                )}
                {flight?.last_contact && (
                  <InfoRow
                    icon={<Clock />}
                    label="Last Contact"
                    value={getTimeSinceContact(flight.last_contact)}
                  />
                )}
              </div>

              {/* Enrichment loading */}
              {isEnriching && (
                <div className="px-4 py-3 flex items-center gap-2 text-[10px] text-[var(--color-text-muted)]">
                  <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  Fetching enriched data...
                </div>
              )}

              {/* Open in external */}
              <div className="p-4">
                <a
                  href={`https://www.flightradar24.com/${flight?.callsign ?? flight?.icao24}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/5 transition-all text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View on FlightRadar24
                </a>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DataCard({
  icon, label, value, className = '',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/5 border border-[var(--color-border)]">
      <div className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
        <span className="w-3.5 h-3.5">{icon}</span>
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <span className={`text-sm font-bold font-mono ${className || 'text-[var(--color-text)]'}`}>
        {value}
      </span>
    </div>
  );
}

function InfoRow({
  icon, label, value, mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
        <span className="w-3.5 h-3.5 flex-shrink-0">{icon}</span>
        <span className="text-xs">{label}</span>
      </div>
      <span className={`text-xs text-[var(--color-text)] ${mono ? 'font-mono' : ''} text-right`}>
        {value}
      </span>
    </div>
  );
}
