'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bookmark, Trash2, PlaneTakeoff, PlaneLanding, Clock, RefreshCw, Plane } from 'lucide-react';
import { useCollectionsStore, useFlightStore, useUIStore } from '@/store';
import { GlassPanel } from '@/components/UI/GlassPanel';
import { Button } from '@/components/UI/Button';
import { formatAltitude, formatSpeed } from '@/lib/theme';
import { SavedFlight, EnrichedFlight } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { useSession } from 'next-auth/react';

export function CollectionsPanel() {
  const { collections, removeFromCollection, isPanelOpen, setPanelOpen, clearAll } = useCollectionsStore();
  const { flights, setSelectedFlight } = useFlightStore();
  const { addToast, setAuthModalOpen } = useUIStore();
  const { data: session } = useSession();

  const handleOpenFlight = (saved: SavedFlight) => {
    // Check if still live
    const live = flights.find((f) => f.icao24 === saved.icao24);
    if (live) {
      setSelectedFlight(live);
      addToast({ type: 'info', message: `${saved.callsign} is live — showing current data` });
    } else {
      // Show saved snapshot
      setSelectedFlight(saved.snapshot);
      addToast({ type: 'info', message: `Showing saved snapshot from ${formatDistanceToNow(new Date(saved.savedAt), { addSuffix: true })}` });
    }
    setPanelOpen(false);
  };

  const handleRemove = (saved: SavedFlight) => {
    removeFromCollection(saved.icao24);
    addToast({ type: 'info', message: `Removed ${saved.callsign}` });
  };

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <>
          {/* Backdrop (mobile) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPanelOpen(false)}
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          />

          <motion.div
            key="collections-panel"
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="fixed left-4 top-20 bottom-4 z-30 w-[320px] flex flex-col pointer-events-auto"
          >
            <GlassPanel className="flex-1 flex flex-col overflow-hidden shadow-panel">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)]/15 flex items-center justify-center">
                    <Bookmark className="w-4 h-4 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[var(--color-text)]">My Collection</h2>
                    <p className="text-[10px] text-[var(--color-text-muted)]">
                      {collections.length} saved flight{collections.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {collections.length > 0 && (
                    <button
                      onClick={() => {
                        if (confirm('Clear all saved flights?')) clearAll();
                      }}
                      className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-400/10 transition-all"
                      title="Clear all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setPanelOpen(false)}
                    className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/10 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {!session && (
                  <div className="p-4 m-3 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20">
                    <p className="text-xs text-[var(--color-text-muted)] mb-2">
                      Sign in to sync your collection across devices
                    </p>
                    <Button size="sm" onClick={() => { setAuthModalOpen(true); setPanelOpen(false); }}>
                      Sign in
                    </Button>
                  </div>
                )}

                {collections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-[var(--color-border)] flex items-center justify-center">
                      <Plane className="w-8 h-8 text-[var(--color-text-muted)] opacity-50" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text)]">No saved flights</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        Click a plane on the globe, then tap the bookmark icon to save it
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {collections.map((saved) => {
                      const isLive = flights.some((f) => f.icao24 === saved.icao24);
                      return (
                        <SavedFlightCard
                          key={saved.id}
                          saved={saved}
                          isLive={isLive}
                          onOpen={() => handleOpenFlight(saved)}
                          onRemove={() => handleRemove(saved)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </GlassPanel>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SavedFlightCard({
  saved,
  isLive,
  onOpen,
  onRemove,
}: {
  saved: SavedFlight;
  isLive: boolean;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const f = saved.snapshot;
  const airline = f.details?.airline;
  const origin = f.details?.origin;
  const dest = f.details?.destination;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="rounded-xl bg-white/5 border border-[var(--color-border)] overflow-hidden hover:border-[var(--color-primary)]/30 transition-all group"
    >
      <button onClick={onOpen} className="w-full p-3 text-left">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
              <Plane
                className="w-4 h-4 text-[var(--color-primary)]"
                style={{ transform: `rotate(${(f.true_track ?? 0) - 90}deg)` }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold font-mono text-[var(--color-text)] truncate">
                  {saved.callsign}
                </span>
                {isLive ? (
                  <span className="flex items-center gap-1 text-[9px] text-green-400 flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    LIVE
                  </span>
                ) : (
                  <span className="text-[9px] text-[var(--color-text-muted)] flex-shrink-0">
                    snapshot
                  </span>
                )}
              </div>
              {airline && (
                <p className="text-[10px] text-[var(--color-text-muted)] truncate">{airline}</p>
              )}
            </div>
          </div>
        </div>

        {/* Route */}
        {(origin || dest) && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono">
            {origin && (
              <span className="flex items-center gap-1 text-[var(--color-text-muted)]">
                <PlaneTakeoff className="w-3 h-3" />
                {origin.iata}
              </span>
            )}
            {origin && dest && <span className="text-[var(--color-border)]">→</span>}
            {dest && (
              <span className="flex items-center gap-1 text-[var(--color-text-muted)]">
                <PlaneLanding className="w-3 h-3" />
                {dest.iata}
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="mt-2 flex items-center gap-3 text-[10px] font-mono text-[var(--color-text-muted)]">
          <span>{formatAltitude(f.baro_altitude)}</span>
          <span>·</span>
          <span>{formatSpeed(f.velocity)}</span>
          <span className="ml-auto flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {formatDistanceToNow(new Date(saved.savedAt), { addSuffix: true })}
          </span>
        </div>
      </button>

      {/* Remove */}
      <div className="border-t border-[var(--color-border)] flex">
        <button
          onClick={onRemove}
          className="flex-1 py-1.5 text-[10px] text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-400/5 transition-all flex items-center justify-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          Remove
        </button>
        {isLive && (
          <button
            onClick={onOpen}
            className="flex-1 py-1.5 text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all flex items-center justify-center gap-1 border-l border-[var(--color-border)]"
          >
            <RefreshCw className="w-3 h-3" />
            Show live
          </button>
        )}
      </div>
    </motion.div>
  );
}
