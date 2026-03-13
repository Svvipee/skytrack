'use client';
import { useRef, useState, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowUpRight, Loader2, PlaneTakeoff } from 'lucide-react';
import { useSearch } from '@/hooks/useSearch';
import { EnrichedFlight } from '@/types';
import { formatAltitude, formatSpeed } from '@/lib/theme';

export function SearchBar() {
  const { searchQuery, searchResults, isSearching, search, selectResult, clearSearch } = useSearch();
  const [inputValue, setInputValue] = useState(searchQuery);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIdx, setSelectedIdx] = useState(-1);

  const showDropdown = isFocused && (searchResults.length > 0 || (inputValue.length > 1 && isSearching));

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setSelectedIdx(-1);
  }, [searchResults]);

  const handleChange = (v: string) => {
    setInputValue(v);
    search(v);
  };

  const handleClear = () => {
    setInputValue('');
    clearSearch();
    inputRef.current?.focus();
  };

  const handleSelect = (flight: EnrichedFlight) => {
    selectResult(flight);
    setInputValue(flight.callsign ?? flight.icao24);
    setIsFocused(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIdx >= 0 && searchResults[selectedIdx]) {
        handleSelect(searchResults[selectedIdx]);
      } else {
        search(inputValue);
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative w-full">
      {/* Input */}
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 ${
          isFocused
            ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30 bg-[var(--color-surface-2)]'
            : 'border-[var(--color-border)] bg-white/5 hover:bg-white/8'
        }`}
      >
        {isSearching ? (
          <Loader2 className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0 animate-spin" />
        ) : (
          <Search className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
        )}

        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder="Search flight, callsign, ICAO24, airline..."
          className="flex-1 bg-transparent text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none min-w-0"
        />

        {inputValue && (
          <button onClick={handleClear} className="flex-shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 right-0 z-50 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] backdrop-blur-lg shadow-panel overflow-hidden"
          >
            {searchResults.length === 0 && isSearching ? (
              <div className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--color-text-muted)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching live traffic...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                No flights found for &quot;{inputValue}&quot;
              </div>
            ) : (
              <>
                <div className="px-3 py-2 border-b border-[var(--color-border)] flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase tracking-wide">
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-[10px] text-[var(--color-text-muted)]">↑↓ to navigate, ↵ to select</span>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {searchResults.map((flight, idx) => (
                    <SearchResultItem
                      key={flight.icao24}
                      flight={flight}
                      isSelected={idx === selectedIdx}
                      onClick={() => handleSelect(flight)}
                    />
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SearchResultItem({
  flight,
  isSelected,
  onClick,
}: {
  flight: EnrichedFlight;
  isSelected: boolean;
  onClick: () => void;
}) {
  const airline = flight.details?.airline;
  const origin = flight.details?.origin?.city ?? flight.origin_country;
  const dest = flight.details?.destination?.city;
  const altColor = flight.baro_altitude
    ? flight.baro_altitude > 10000 ? 'text-orange-400' : 'text-green-400'
    : 'text-gray-400';

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-100 ${
        isSelected ? 'bg-[var(--color-primary)]/10' : 'hover:bg-white/5'
      }`}
    >
      <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
        <PlaneTakeoff className="w-4 h-4 text-[var(--color-primary)]" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-[var(--color-text)] font-mono">
            {flight.callsign ?? flight.icao24}
          </span>
          {flight.details?.flightNumber && flight.details.flightNumber !== flight.callsign && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-mono">
              {flight.details.flightNumber}
            </span>
          )}
        </div>
        <div className="text-[10px] text-[var(--color-text-muted)] truncate">
          {airline ? `${airline} · ` : ''}
          {origin}
          {dest ? ` → ${dest}` : ''}
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <div className={`text-xs font-mono font-medium ${altColor}`}>
          {formatAltitude(flight.baro_altitude)}
        </div>
        <div className="text-[10px] text-[var(--color-text-muted)] font-mono">
          {formatSpeed(flight.velocity)}
        </div>
      </div>

      <ArrowUpRight className="w-3.5 h-3.5 text-[var(--color-text-muted)] flex-shrink-0" />
    </button>
  );
}
