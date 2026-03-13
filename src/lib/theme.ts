import { TimeOfDay, ThemeConfig } from '@/types';

export function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'sunset';
  return 'night';
}

export function getThemeConfig(hour: number): ThemeConfig {
  const timeOfDay = getTimeOfDay(hour);

  const configs: Record<TimeOfDay, ThemeConfig> = {
    dawn: {
      timeOfDay: 'dawn',
      hour,
      colors: {
        primary: '#a855f7',
        accent: '#f472b6',
        surface: 'rgba(15, 10, 30, 0.85)',
        surface2: 'rgba(30, 20, 50, 0.75)',
        text: '#f1e8ff',
        textMuted: '#c4b5d6',
        border: 'rgba(168, 85, 247, 0.25)',
        glow: 'rgba(244, 114, 182, 0.5)',
        bg: '#0a0520',
        bgGradient: 'linear-gradient(135deg, #0a0520 0%, #1a0535 40%, #2d0a4e 70%, #3d1060 100%)',
      },
      globeAtmosphere: '#a855f7',
      globeImageUrl: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      backgroundImageUrl: 'https://unpkg.com/three-globe/example/img/night-sky.png',
      starsVisible: true,
    },

    day: {
      timeOfDay: 'day',
      hour,
      colors: {
        primary: '#0ea5e9',
        accent: '#38bdf8',
        surface: 'rgba(240, 248, 255, 0.85)',
        surface2: 'rgba(224, 242, 254, 0.80)',
        text: '#0c1a2e',
        textMuted: '#334e68',
        border: 'rgba(14, 165, 233, 0.20)',
        glow: 'rgba(56, 189, 248, 0.4)',
        bg: '#e0f2fe',
        bgGradient: 'linear-gradient(160deg, #bae6fd 0%, #e0f2fe 40%, #f0f9ff 70%, #ffffff 100%)',
      },
      globeAtmosphere: '#38bdf8',
      globeImageUrl: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      backgroundImageUrl: '',
      starsVisible: false,
    },

    sunset: {
      timeOfDay: 'sunset',
      hour,
      colors: {
        primary: '#f97316',
        accent: '#fbbf24',
        surface: 'rgba(30, 15, 5, 0.85)',
        surface2: 'rgba(50, 25, 10, 0.78)',
        text: '#fff7ed',
        textMuted: '#fcd34d',
        border: 'rgba(249, 115, 22, 0.25)',
        glow: 'rgba(251, 191, 36, 0.5)',
        bg: '#1c0a02',
        bgGradient: 'linear-gradient(160deg, #1c0a02 0%, #3d1a08 30%, #6b2d10 60%, #92400e 80%, #b45309 100%)',
      },
      globeAtmosphere: '#f97316',
      globeImageUrl: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
      backgroundImageUrl: 'https://unpkg.com/three-globe/example/img/night-sky.png',
      starsVisible: false,
    },

    night: {
      timeOfDay: 'night',
      hour,
      colors: {
        primary: '#06b6d4',
        accent: '#22d3ee',
        surface: 'rgba(5, 10, 25, 0.90)',
        surface2: 'rgba(10, 20, 45, 0.82)',
        text: '#e2f4fd',
        textMuted: '#7fb3c8',
        border: 'rgba(6, 182, 212, 0.20)',
        glow: 'rgba(34, 211, 238, 0.45)',
        bg: '#030712',
        bgGradient: 'linear-gradient(135deg, #020810 0%, #050f1e 30%, #071628 60%, #0a1f35 100%)',
      },
      globeAtmosphere: '#06b6d4',
      globeImageUrl: 'https://unpkg.com/three-globe/example/img/earth-night.jpg',
      backgroundImageUrl: 'https://unpkg.com/three-globe/example/img/night-sky.png',
      starsVisible: true,
    },
  };

  return configs[timeOfDay];
}

export function applyThemeToCSSVars(theme: ThemeConfig) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const c = theme.colors;
  root.style.setProperty('--color-primary', c.primary);
  root.style.setProperty('--color-accent', c.accent);
  root.style.setProperty('--color-surface', c.surface);
  root.style.setProperty('--color-surface-2', c.surface2);
  root.style.setProperty('--color-text', c.text);
  root.style.setProperty('--color-text-muted', c.textMuted);
  root.style.setProperty('--color-border', c.border);
  root.style.setProperty('--color-glow', c.glow);
  root.style.setProperty('--color-bg', c.bg);
  root.style.setProperty('--bg-gradient', c.bgGradient);
}

export function getAltitudeColor(altMeters: number | null, theme: ThemeConfig): string {
  if (altMeters === null || altMeters <= 0) return '#94a3b8';
  const altFt = altMeters * 3.28084;
  if (altFt < 5000) return '#22c55e';
  if (altFt < 15000) return '#84cc16';
  if (altFt < 25000) return '#eab308';
  if (altFt < 35000) return '#f97316';
  return '#ef4444';
}

export function formatAltitude(meters: number | null): string {
  if (meters === null) return 'N/A';
  const feet = Math.round(meters * 3.28084);
  return `${feet.toLocaleString()} ft`;
}

export function formatSpeed(ms: number | null): string {
  if (ms === null) return 'N/A';
  const knots = Math.round(ms * 1.94384);
  return `${knots} kts`;
}

export function formatVerticalRate(ms: number | null): string {
  if (ms === null) return 'N/A';
  const fpm = Math.round(ms * 196.85);
  const sign = fpm >= 0 ? '+' : '';
  return `${sign}${fpm.toLocaleString()} fpm`;
}

export function formatHeading(degrees: number | null): string {
  if (degrees === null) return 'N/A';
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const idx = Math.round(degrees / 22.5) % 16;
  return `${Math.round(degrees)}° ${dirs[idx]}`;
}

export function getTimeSinceContact(unixTs: number): string {
  const now = Date.now() / 1000;
  const diff = now - unixTs;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  return `${Math.round(diff / 3600)}h ago`;
}
