'use client';
import { useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Globe2, Wind, TrendingUp,
  Pause, Play, Layers
} from 'lucide-react';
import { Globe } from '@/components/Globe';
import { Header } from '@/components/Header/Header';
import { FlightPanel } from '@/components/FlightPanel/FlightPanel';
import { CollectionsPanel } from '@/components/Collections/CollectionsPanel';
import { AuthModal } from '@/components/Auth/AuthModal';
import { ToastContainer } from '@/components/UI/Toast';
import { useFlights } from '@/hooks/useFlights';
import { useTheme } from '@/hooks/useTheme';
import { useFlightStore, useCollectionsStore, useUIStore } from '@/store';
import { EnrichedFlight } from '@/types';

export default function Home() {
  const theme = useTheme();
  const { flights } = useFlights();
  const { selectedFlight, setSelectedFlight, lastUpdate, isLoading } = useFlightStore();
  const { collections, isPanelOpen: isCollectionOpen } = useCollectionsStore();
  const { globeAutoRotate, setGlobeAutoRotate, mapCenter } = useUIStore();

  const handleFlightClick = useCallback(
    (flight: EnrichedFlight) => {
      setSelectedFlight(flight);
      setGlobeAutoRotate(false);
    },
    [setSelectedFlight, setGlobeAutoRotate]
  );

  // Stats
  const airborne = flights.filter((f) => !f.on_ground).length;
  const avgAlt = flights.reduce((sum, f) => sum + (f.altitudeFt ?? 0), 0) / Math.max(flights.length, 1);
  const avgSpd = flights.reduce((sum, f) => sum + (f.speedKts ?? 0), 0) / Math.max(flights.length, 1);

  return (
    <main className="relative w-full h-screen overflow-hidden" style={{ background: 'var(--bg-gradient)' }}>
      {/* Header */}
      <Header />

      {/* Globe */}
      <div className="absolute inset-0 globe-container">
        <Globe
          flights={flights}
          savedFlights={collections}
          selectedFlight={selectedFlight}
          theme={theme}
          mapCenter={mapCenter}
          onFlightClick={handleFlightClick}
          autoRotate={globeAutoRotate}
        />
      </div>

      {/* Ambient overlay based on time of day */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            theme.timeOfDay === 'night'
              ? 'radial-gradient(ellipse at top, transparent 40%, rgba(0,0,0,0.4) 100%)'
              : theme.timeOfDay === 'sunset'
              ? 'radial-gradient(ellipse at bottom right, rgba(249,115,22,0.08) 0%, transparent 60%)'
              : theme.timeOfDay === 'dawn'
              ? 'radial-gradient(ellipse at top left, rgba(168,85,247,0.08) 0%, transparent 60%)'
              : 'radial-gradient(ellipse at top, rgba(56,189,248,0.04) 0%, transparent 60%)',
          transition: 'background 3s ease',
        }}
      />

      {/* Stars overlay (night/dawn) */}
      {theme.starsVisible && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${Math.random() * 2 + 1}px`,
                height: `${Math.random() * 2 + 1}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random(),
                animation: `pulse ${2 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Panels */}
      <CollectionsPanel />
      <FlightPanel />

      {/* Bottom Stats Bar — slides right when collections panel is open */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1, x: isCollectionOpen ? 336 : 0 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 30 }}
        className="absolute bottom-4 left-4 z-20 pointer-events-none"
      >
        <div className="flex items-center gap-1 px-3 py-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] backdrop-blur-lg shadow-glass pointer-events-auto">
          {/* Live indicator */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl">
            <Activity className="w-3.5 h-3.5 text-[var(--color-accent)]" />
            <div>
              <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">Live</div>
              <div className="text-sm font-bold font-mono tabular-nums text-[var(--color-text)]">
                {airborne.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="w-px h-8 bg-[var(--color-border)]" />

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl">
            <Globe2 className="w-3.5 h-3.5 text-[var(--color-accent)]" />
            <div>
              <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">Total</div>
              <div className="text-sm font-bold font-mono tabular-nums text-[var(--color-text)]">
                {flights.length.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="w-px h-8 bg-[var(--color-border)] hidden sm:block" />

          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl">
            <Wind className="w-3.5 h-3.5 text-[var(--color-accent)]" />
            <div>
              <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">Avg Alt</div>
              <div className="text-sm font-bold font-mono tabular-nums text-[var(--color-text)]">
                {Math.round(avgAlt / 100) * 100 > 0
                  ? `${(Math.round(avgAlt / 100) * 100).toLocaleString()} ft`
                  : '—'}
              </div>
            </div>
          </div>

          <div className="w-px h-8 bg-[var(--color-border)] hidden sm:block" />

          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl">
            <TrendingUp className="w-3.5 h-3.5 text-[var(--color-accent)]" />
            <div>
              <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">Avg Speed</div>
              <div className="text-sm font-bold font-mono tabular-nums text-[var(--color-text)]">
                {Math.round(avgSpd) > 0 ? `${Math.round(avgSpd)} kts` : '—'}
              </div>
            </div>
          </div>

          <div className="w-px h-8 bg-[var(--color-border)]" />

          {/* Rotate toggle */}
          <button
            onClick={() => setGlobeAutoRotate(!globeAutoRotate)}
            data-tooltip={globeAutoRotate ? 'Pause rotation' : 'Resume rotation'}
            className="p-2 rounded-xl hover:bg-white/10 transition-all text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          >
            {globeAutoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
      </motion.div>

      {/* Time of day badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute top-20 right-4 z-10 mt-2"
      >
        <TimeOfDayBadge timeOfDay={theme.timeOfDay} />
      </motion.div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
        className="absolute bottom-24 left-4 z-20 hidden lg:block"
      >
        <AltitudeLegend />
      </motion.div>

      {/* Auth Modal */}
      <AuthModal />

      {/* Toasts */}
      <ToastContainer />
    </main>
  );
}

function TimeOfDayBadge({ timeOfDay }: { timeOfDay: string }) {
  const config = {
    dawn: { icon: '🌅', label: 'Dawn', color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-200' },
    day: { icon: '☀️', label: 'Daytime', color: 'from-sky-500/20 to-blue-500/20 border-sky-500/30 text-sky-200' },
    sunset: { icon: '🌇', label: 'Golden Hour', color: 'from-orange-500/20 to-yellow-500/20 border-orange-500/30 text-orange-200' },
    night: { icon: '🌙', label: 'Night', color: 'from-blue-900/40 to-slate-900/40 border-cyan-500/20 text-cyan-200' },
  }[timeOfDay] ?? { icon: '✈', label: '', color: '' };

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r ${config.color} border backdrop-blur-md text-xs font-medium`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
}

function AltitudeLegend() {
  const items = [
    { color: 'bg-green-400', label: '< 5,000 ft' },
    { color: 'bg-lime-400', label: '5–15k ft' },
    { color: 'bg-yellow-400', label: '15–25k ft' },
    { color: 'bg-orange-400', label: '25–35k ft' },
    { color: 'bg-red-400', label: '> 35,000 ft' },
  ];

  return (
    <div className="flex flex-col gap-1.5 px-3 py-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] backdrop-blur-md">
      <div className="flex items-center gap-1.5 mb-1">
        <Layers className="w-3 h-3 text-[var(--color-text-muted)]" />
        <span className="text-[9px] uppercase tracking-widest text-[var(--color-text-muted)]">Altitude</span>
      </div>
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${item.color}`} />
          <span className="text-[10px] text-[var(--color-text-muted)] font-mono">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
