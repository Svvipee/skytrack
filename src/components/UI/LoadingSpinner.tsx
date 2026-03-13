'use client';

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size];
  return (
    <div className={`${s} rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin`} />
  );
}

export function RadarPing() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-radar absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
    </span>
  );
}

export function GlobeLoader() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full border-4 border-[var(--color-border)] animate-spin-slow" />
        <div className="absolute inset-2 rounded-full border-2 border-[var(--color-accent)] opacity-60 animate-spin-slow" style={{ animationDirection: 'reverse' }} />
        <div className="absolute inset-0 flex items-center justify-center text-4xl">✈</div>
      </div>
      <div className="text-[var(--color-text-muted)] text-sm font-mono animate-pulse">
        Loading live traffic...
      </div>
    </div>
  );
}
