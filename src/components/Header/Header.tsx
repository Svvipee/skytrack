'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut, useSession } from 'next-auth/react';
import {
  Plane, Bookmark, LogIn, LogOut, User, ChevronDown,
  Wifi, RefreshCw, Menu, X
} from 'lucide-react';
import { useFlightStore, useCollectionsStore, useUIStore } from '@/store';
import { Button } from '@/components/UI/Button';
import { RadarPing } from '@/components/UI/LoadingSpinner';
import { SearchBar } from '@/components/SearchBar/SearchBar';
import { formatDistanceToNow } from 'date-fns';

export function Header() {
  const { data: session } = useSession();
  const { lastUpdate, flights, isLoading } = useFlightStore();
  const { collections, togglePanel, isPanelOpen } = useCollectionsStore();
  const { setAuthModalOpen } = useUIStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const lastUpdateText = lastUpdate
    ? formatDistanceToNow(new Date(lastUpdate), { addSuffix: true })
    : 'Loading...';

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 py-3">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="max-w-screen-xl mx-auto flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] backdrop-blur-lg shadow-glass"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="relative w-8 h-8 rounded-xl bg-[var(--color-primary)]/15 flex items-center justify-center">
            <Plane className="w-4 h-4 text-[var(--color-primary)] rotate-45" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 ring-1 ring-[var(--color-surface)]" />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-[var(--color-text)] tracking-tight text-sm">
              SkyTrack
            </span>
            <div className="text-[10px] text-[var(--color-text-muted)] font-mono leading-none">
              LIVE
            </div>
          </div>
        </div>

        {/* Search Bar - grows to fill space */}
        <div className="flex-1 max-w-xl mx-auto hidden md:block">
          <SearchBar />
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Live Status */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-[var(--color-border)]">
            {isLoading ? (
              <RefreshCw className="w-3 h-3 text-[var(--color-text-muted)] animate-spin" />
            ) : (
              <RadarPing />
            )}
            <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
              {flights.length.toLocaleString()} live
            </span>
            <span className="text-[var(--color-border)]">·</span>
            <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
              {lastUpdateText}
            </span>
          </div>

          {/* Collections Toggle */}
          <button
            onClick={togglePanel}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all duration-200 text-sm font-medium ${
              isPanelOpen
                ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]/40 text-[var(--color-primary)]'
                : 'bg-white/5 border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/10'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isPanelOpen ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline text-xs">Saved</span>
            {collections.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[var(--color-primary)] text-white text-[9px] font-bold">
                {collections.length}
              </span>
            )}
          </button>

          {/* Auth */}
          {session ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/5 border border-[var(--color-border)] hover:bg-white/10 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)] text-xs font-bold">
                  {(session.user?.name ?? session.user?.email ?? 'U')[0].toUpperCase()}
                </div>
                <span className="hidden sm:block text-xs text-[var(--color-text-muted)] max-w-[80px] truncate">
                  {session.user?.name ?? session.user?.email}
                </span>
                <ChevronDown className="w-3 h-3 text-[var(--color-text-muted)]" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] backdrop-blur-lg shadow-panel overflow-hidden"
                  >
                    <div className="px-3 py-2 border-b border-[var(--color-border)]">
                      <p className="text-xs font-medium text-[var(--color-text)]">{session.user?.name}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)] truncate">{session.user?.email}</p>
                    </div>
                    <button
                      onClick={() => { signOut(); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-white/5 transition-all"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign in</span>
            </Button>
          )}

          {/* Mobile Menu */}
          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="md:hidden p-1.5 rounded-lg hover:bg-white/10 transition-all text-[var(--color-text-muted)]"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>

      {/* Mobile Search Bar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden mt-2 max-w-screen-xl mx-auto px-1"
          >
            <SearchBar />
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
