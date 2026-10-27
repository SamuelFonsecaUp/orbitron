import React from 'react';
import { GameRarity } from '../types';

export interface AchievementBadgeProps {
  rarity: GameRarity;
  iconName?: string;
  unlocked?: boolean;
  progress?: number; // 0 to 100
  size?: number; // default 64
  className?: string;
  showGlow?: boolean;
}

// Canonical clean SVG paths for icons (compatible with pure standalone SVG files)
const ICON_PATHS: Record<string, string> = {
  Trophy: 'M6 9H4a2 2 0 0 1-2-2V5h4m12 4h2a2 2 0 0 0 2-2V5h-4M4 5h16v4c0 3.3-2.7 6-6 6h-4c-3.3 0-6-2.7-6-6V5zm6 10v3m-3 3h10v-3H7v3z',
  Crown: 'm2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 14h14v2H5v-2z',
  Shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  ShieldCheck: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zm-2-10 2 2 4-4',
  FileUp: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm0 0v6h6M12 12v6m-3-3l3-3 3 3',
  CreditCard: 'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7zm0 3h20M6 15h4',
  Target: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 4a6 6 0 1 0 6 6 6 6 0 0 0-6-6zm0 3a3 3 0 1 0 3 3 3 3 0 0 0-3-3z',
  Flame: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  Sparkles: 'm12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z',
  Lock: 'M16 11V7a4 4 0 0 0-8 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z',
  PiggyBank: 'M19 12a7 7 0 1 0-14 0c0 1.2.3 2.3.9 3.3L5 19h3l1-1h6l1 1h3l-.9-3.7A6.9 6.9 0 0 0 19 12zM15 9h-4M13 7v4',
  Tags: 'm15 5 4 4-8 8H7v-4l8-8zm-8 4h.01',
  CalendarCheck: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm4 10l2 2 4-4',
  BookOpen: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
  TrendingUp: 'm22 7-8.5 8.5-5-5L2 17m14-10h6v6',
  Zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  Search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm10 2l-4.35-4.35',
  Rocket: 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3m5.5-3.5L12 6c-3-3-7-3-7-3s0 4 3 7l2.5 2.5m4-4L21 3s-4 0-7 3l-2.5 2.5',
};

// Generates the raw XML SVG markup for standalone download or direct rendering
export function generateAchievementSvgString({
  rarity,
  iconName = 'Trophy',
  unlocked = true,
  progress = 100,
  size = 256,
}: {
  rarity: GameRarity;
  iconName?: string;
  unlocked?: boolean;
  progress?: number;
  size?: number;
}): string {
  const iconD = ICON_PATHS[iconName] || ICON_PATHS.Trophy;
  const pct = Math.max(0, Math.min(100, progress));
  const circ = 2 * Math.PI * 34; // radius 34 in 100x100 viewBox
  const dashOffset = circ - (circ * pct) / 100;

  let defs = '';
  let frame = '';
  let glowFilter = '';

  if (rarity === 'lendario') {
    // Legendary: Solar Supernova (Gold, Rays, Octagonal Radiance)
    defs = `
      <linearGradient id="legBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a" />
        <stop offset="30%" stop-color="#f59e0b" />
        <stop offset="70%" stop-color="#d97706" />
        <stop offset="100%" stop-color="#78350f" />
      </linearGradient>
      <linearGradient id="legBorder" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fffbeb" />
        <stop offset="50%" stop-color="#fbbf24" />
        <stop offset="100%" stop-color="#b45309" />
      </linearGradient>
      <radialGradient id="legGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.8" />
        <stop offset="60%" stop-color="#d97706" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#f59e0b" stop-opacity="0" />
      </radialGradient>
      <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    `;

    frame = `
      <!-- Solar Rays Aura -->
      <g opacity="${unlocked ? '0.9' : '0.2'}">
        <circle cx="50" cy="50" r="46" fill="url(#legGlow)" />
        <path d="M50 4 L53 14 L50 12 L47 14 Z M50 96 L53 86 L50 88 L47 86 Z M4 50 L14 53 L12 50 L14 47 Z M96 50 L86 53 L88 50 L86 47 Z" fill="#fde68a" />
        <path d="M17 17 L25 23 L23 25 L17 23 Z M83 83 L75 77 L77 75 L83 77 Z M17 83 L25 77 L23 75 L17 77 Z M83 17 L75 23 L77 25 L83 23 Z" fill="#fbbf24" opacity="0.8" />
      </g>
      <!-- Solar Supernova Outer Ring -->
      <polygon points="50,8 63,14 75,25 86,37 92,50 86,63 75,75 63,86 50,92 37,86 25,75 14,63 8,50 14,37 25,25 37,14" fill="${unlocked ? 'url(#legBg)' : '#1e1b18'}" stroke="url(#legBorder)" stroke-width="2.5" />
      <!-- Inner Ring -->
      <circle cx="50" cy="50" r="32" fill="${unlocked ? '#451a03' : '#141210'}" stroke="#fef08a" stroke-width="1.2" opacity="0.9" />
      <!-- 4 Supernova Stars -->
      <circle cx="50" cy="18" r="1.5" fill="#ffffff" />
      <circle cx="82" cy="50" r="1.5" fill="#ffffff" />
      <circle cx="50" cy="82" r="1.5" fill="#ffffff" />
      <circle cx="18" cy="50" r="1.5" fill="#ffffff" />
    `;
    glowFilter = 'filter="url(#goldGlow)"';
  } else if (rarity === 'epico') {
    // Epic: Nebula Octagram (Purple & Amethyst Cosmic Crystal)
    defs = `
      <linearGradient id="epiBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#e9d5ff" />
        <stop offset="35%" stop-color="#a855f7" />
        <stop offset="70%" stop-color="#7e22ce" />
        <stop offset="100%" stop-color="#3b0764" />
      </linearGradient>
      <linearGradient id="epiBorder" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f3e8ff" />
        <stop offset="50%" stop-color="#c084fc" />
        <stop offset="100%" stop-color="#6b21a8" />
      </linearGradient>
      <radialGradient id="epiGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#a855f7" stop-opacity="0.7" />
        <stop offset="60%" stop-color="#7e22ce" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#a855f7" stop-opacity="0" />
      </radialGradient>
      <filter id="purpleGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    `;

    frame = `
      <circle cx="50" cy="50" r="44" fill="url(#epiGlow)" opacity="${unlocked ? '0.8' : '0.15'}" />
      <!-- Octagram Outer Crest -->
      <polygon points="50,10 61,22 78,22 78,39 90,50 78,61 78,78 61,78 50,90 39,78 22,78 22,61 10,50 22,39 22,22 39,22" fill="${unlocked ? 'url(#epiBg)' : '#171120'}" stroke="url(#epiBorder)" stroke-width="2.2" />
      <!-- Inner Octagon -->
      <polygon points="50,18 72,28 82,50 72,72 50,82 28,72 18,50 28,28" fill="${unlocked ? '#2e1065' : '#0f0a17'}" stroke="#e9d5ff" stroke-width="1" opacity="0.85" />
    `;
    glowFilter = 'filter="url(#purpleGlow)"';
  } else if (rarity === 'raro') {
    // Rare: Quantum Hexagon (Cyan & Sapphire Pulsar)
    defs = `
      <linearGradient id="rarBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#bae6fd" />
        <stop offset="30%" stop-color="#0ea5e9" />
        <stop offset="70%" stop-color="#0284c7" />
        <stop offset="100%" stop-color="#082f49" />
      </linearGradient>
      <linearGradient id="rarBorder" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#e0f2fe" />
        <stop offset="50%" stop-color="#38bdf8" />
        <stop offset="100%" stop-color="#0369a1" />
      </linearGradient>
      <radialGradient id="rarGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#0284c7" stop-opacity="0.6" />
        <stop offset="70%" stop-color="#0ea5e9" stop-opacity="0.2" />
        <stop offset="100%" stop-color="#0284c7" stop-opacity="0" />
      </radialGradient>
      <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    `;

    frame = `
      <circle cx="50" cy="50" r="44" fill="url(#rarGlow)" opacity="${unlocked ? '0.85' : '0.15'}" />
      <!-- High-tech Hexagon -->
      <polygon points="50,10 85,28 85,72 50,90 15,72 15,28" fill="${unlocked ? 'url(#rarBg)' : '#0e1726'}" stroke="url(#rarBorder)" stroke-width="2.5" />
      <!-- Inner Hexagon Ring -->
      <polygon points="50,18 78,33 78,67 50,82 22,67 22,33" fill="${unlocked ? '#082f49' : '#08111d'}" stroke="#7dd3fc" stroke-width="1.2" opacity="0.9" />
      <!-- Corner Vector Notches -->
      <circle cx="50" cy="14" r="1.5" fill="#e0f2fe" />
      <circle cx="81" cy="30" r="1.5" fill="#e0f2fe" />
      <circle cx="81" cy="70" r="1.5" fill="#e0f2fe" />
      <circle cx="50" cy="86" r="1.5" fill="#e0f2fe" />
      <circle cx="19" cy="70" r="1.5" fill="#e0f2fe" />
      <circle cx="19" cy="30" r="1.5" fill="#e0f2fe" />
    `;
    glowFilter = 'filter="url(#cyanGlow)"';
  } else {
    // Common: Aerospace Shield (Titanium & Steel)
    defs = `
      <linearGradient id="comBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#cbd5e1" />
        <stop offset="35%" stop-color="#64748b" />
        <stop offset="70%" stop-color="#475569" />
        <stop offset="100%" stop-color="#1e293b" />
      </linearGradient>
      <linearGradient id="comBorder" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f8fafc" />
        <stop offset="50%" stop-color="#94a3b8" />
        <stop offset="100%" stop-color="#334155" />
      </linearGradient>
      <radialGradient id="comGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#94a3b8" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#475569" stop-opacity="0" />
      </radialGradient>
    `;

    frame = `
      <circle cx="50" cy="50" r="42" fill="url(#comGlow)" opacity="${unlocked ? '0.6' : '0.1'}" />
      <!-- Rounded Aerospace Shield -->
      <path d="M50 10 L82 20 C82 52, 68 76, 50 90 C32 76, 18 52, 18 20 Z" fill="${unlocked ? 'url(#comBg)' : '#141a24'}" stroke="url(#comBorder)" stroke-width="2.2" />
      <!-- Inner Shield Line -->
      <path d="M50 18 L75 26 C75 50, 64 70, 50 82 C36 70, 25 50, 25 26 Z" fill="${unlocked ? '#0f172a' : '#0b1017'}" stroke="#94a3b8" stroke-width="1" opacity="0.8" />
      <!-- Rivets -->
      <circle cx="50" cy="14" r="1.2" fill="#e2e8f0" />
      <circle cx="78" cy="22" r="1.2" fill="#e2e8f0" />
      <circle cx="22" cy="22" r="1.2" fill="#e2e8f0" />
    `;
    glowFilter = '';
  }

  // Content inside emblem: Icon (if unlocked) or Lock + Circular progress (if locked)
  let content = '';
  if (unlocked) {
    const iconColor =
      rarity === 'lendario'
        ? '#fef08a'
        : rarity === 'epico'
        ? '#f3e8ff'
        : rarity === 'raro'
        ? '#e0f2fe'
        : '#f8fafc';

    content = `
      <g transform="translate(35, 35) scale(1.25)" fill="none" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${glowFilter}>
        <path d="${iconD}" />
      </g>
    `;
  } else {
    // Locked State: Holographic Lock + Radial progress track
    const trackColor =
      rarity === 'lendario'
        ? '#f59e0b'
        : rarity === 'epico'
        ? '#a855f7'
        : rarity === 'raro'
        ? '#0ea5e9'
        : '#64748b';

    content = `
      <!-- Progress Arc -->
      <circle cx="50" cy="50" r="34" fill="none" stroke="#1e293b" stroke-width="3" opacity="0.6" />
      <circle cx="50" cy="50" r="34" fill="none" stroke="${trackColor}" stroke-width="3" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${dashOffset}" transform="rotate(-90 50 50)" />
      <!-- Lock Hologram -->
      <g transform="translate(37, 37) scale(1.1)" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="${ICON_PATHS.Lock}" />
      </g>
    `;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
  <defs>
    ${defs}
  </defs>
  ${frame}
  ${content}
</svg>`.trim();
}

export const AchievementBadgeSvg: React.FC<AchievementBadgeProps> = ({
  rarity,
  iconName = 'Trophy',
  unlocked = true,
  progress = 100,
  size = 64,
  className = '',
  showGlow = true,
}) => {
  const iconD = ICON_PATHS[iconName] || ICON_PATHS.Trophy;
  const pct = Math.max(0, Math.min(100, progress));
  const circ = 2 * Math.PI * 34;
  const dashOffset = circ - (circ * pct) / 100;

  // Unlocked colors
  const iconColor =
    rarity === 'lendario'
      ? '#fef08a'
      : rarity === 'epico'
      ? '#f3e8ff'
      : rarity === 'raro'
      ? '#e0f2fe'
      : '#f8fafc';

  const progressStroke =
    rarity === 'lendario'
      ? '#f59e0b'
      : rarity === 'epico'
      ? '#a855f7'
      : rarity === 'raro'
      ? '#0ea5e9'
      : '#94a3b8';

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
      style={{
        filter: showGlow && unlocked
          ? rarity === 'lendario'
            ? 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.6))'
            : rarity === 'epico'
            ? 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.55))'
            : rarity === 'raro'
            ? 'drop-shadow(0 0 9px rgba(14, 165, 233, 0.5))'
            : 'drop-shadow(0 0 6px rgba(148, 163, 184, 0.3))'
          : undefined,
      }}
    >
      <defs>
        {/* Legendary Gradients */}
        <linearGradient id={`bg-lendario-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="30%" stopColor="#f59e0b" />
          <stop offset="70%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <linearGradient id={`bd-lendario-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>

        {/* Epic Gradients */}
        <linearGradient id={`bg-epico-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e9d5ff" />
          <stop offset="35%" stopColor="#a855f7" />
          <stop offset="70%" stopColor="#7e22ce" />
          <stop offset="100%" stopColor="#3b0764" />
        </linearGradient>
        <linearGradient id={`bd-epico-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f3e8ff" />
          <stop offset="50%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#6b21a8" />
        </linearGradient>

        {/* Rare Gradients */}
        <linearGradient id={`bg-raro-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#bae6fd" />
          <stop offset="30%" stopColor="#0ea5e9" />
          <stop offset="70%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#082f49" />
        </linearGradient>
        <linearGradient id={`bd-raro-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>

        {/* Common Gradients */}
        <linearGradient id={`bg-comum-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="35%" stopColor="#64748b" />
          <stop offset="70%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>
        <linearGradient id={`bd-comum-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="50%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
      </defs>

      {/* Frame Geometry by Rarity */}
      {rarity === 'lendario' && (
        <g>
          {/* Solar Supernova Corona Rays */}
          <g opacity={unlocked ? 0.9 : 0.2}>
            <path
              d="M50 4 L53 14 L50 12 L47 14 Z M50 96 L53 86 L50 88 L47 86 Z M4 50 L14 53 L12 50 L14 47 Z M96 50 L86 53 L88 50 L86 47 Z"
              fill="#fde68a"
            />
            <path
              d="M17 17 L25 23 L23 25 L17 23 Z M83 83 L75 77 L77 75 L83 77 Z M17 83 L25 77 L23 75 L17 77 Z M83 17 L75 23 L77 25 L83 23 Z"
              fill="#fbbf24"
              opacity="0.8"
            />
          </g>
          {/* Supernova Faceted Ring */}
          <polygon
            points="50,8 63,14 75,25 86,37 92,50 86,63 75,75 63,86 50,92 37,86 25,75 14,63 8,50 14,37 25,25 37,14"
            fill={unlocked ? `url(#bg-lendario-${size})` : '#1c1917'}
            stroke={`url(#bd-lendario-${size})`}
            strokeWidth="2.5"
          />
          <circle
            cx="50"
            cy="50"
            r="32"
            fill={unlocked ? '#451a03' : '#141210'}
            stroke="#fef08a"
            strokeWidth="1.2"
            opacity="0.9"
          />
          <circle cx="50" cy="18" r="1.5" fill="#ffffff" />
          <circle cx="82" cy="50" r="1.5" fill="#ffffff" />
          <circle cx="50" cy="82" r="1.5" fill="#ffffff" />
          <circle cx="18" cy="50" r="1.5" fill="#ffffff" />
        </g>
      )}

      {rarity === 'epico' && (
        <g>
          {/* Nebula Octagram */}
          <polygon
            points="50,10 61,22 78,22 78,39 90,50 78,61 78,78 61,78 50,90 39,78 22,78 22,61 10,50 22,39 22,22 39,22"
            fill={unlocked ? `url(#bg-epico-${size})` : '#171120'}
            stroke={`url(#bd-epico-${size})`}
            strokeWidth="2.2"
          />
          <polygon
            points="50,18 72,28 82,50 72,72 50,82 28,72 18,50 28,28"
            fill={unlocked ? '#2e1065' : '#0f0a17'}
            stroke="#e9d5ff"
            strokeWidth="1"
            opacity="0.85"
          />
        </g>
      )}

      {rarity === 'raro' && (
        <g>
          {/* Quantum Hexagon */}
          <polygon
            points="50,10 85,28 85,72 50,90 15,72 15,28"
            fill={unlocked ? `url(#bg-raro-${size})` : '#0e1726'}
            stroke={`url(#bd-raro-${size})`}
            strokeWidth="2.5"
          />
          <polygon
            points="50,18 78,33 78,67 50,82 22,67 22,33"
            fill={unlocked ? '#082f49' : '#08111d'}
            stroke="#7dd3fc"
            strokeWidth="1.2"
            opacity="0.9"
          />
          <circle cx="50" cy="14" r="1.5" fill="#e0f2fe" />
          <circle cx="81" cy="30" r="1.5" fill="#e0f2fe" />
          <circle cx="81" cy="70" r="1.5" fill="#e0f2fe" />
          <circle cx="50" cy="86" r="1.5" fill="#e0f2fe" />
          <circle cx="19" cy="70" r="1.5" fill="#e0f2fe" />
          <circle cx="19" cy="30" r="1.5" fill="#e0f2fe" />
        </g>
      )}

      {rarity === 'comum' && (
        <g>
          {/* Aerospace Shield */}
          <path
            d="M50 10 L82 20 C82 52, 68 76, 50 90 C32 76, 18 52, 18 20 Z"
            fill={unlocked ? `url(#bg-comum-${size})` : '#141a24'}
            stroke={`url(#bd-comum-${size})`}
            strokeWidth="2.2"
          />
          <path
            d="M50 18 L75 26 C75 50, 64 70, 50 82 C36 70, 25 50, 25 26 Z"
            fill={unlocked ? '#0f172a' : '#0b1017'}
            stroke="#94a3b8"
            strokeWidth="1"
            opacity="0.8"
          />
          <circle cx="50" cy="14" r="1.2" fill="#e2e8f0" />
          <circle cx="78" cy="22" r="1.2" fill="#e2e8f0" />
          <circle cx="22" cy="22" r="1.2" fill="#e2e8f0" />
        </g>
      )}

      {/* Center Content: Icon if unlocked, Lock + Radial progress if locked */}
      {unlocked ? (
        <g
          transform="translate(35, 35) scale(1.25)"
          fill="none"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={iconD} />
        </g>
      ) : (
        <g>
          {/* Radial progress ring */}
          <circle
            cx="50"
            cy="50"
            r="34"
            fill="none"
            stroke="#1e293b"
            strokeWidth="3"
            opacity="0.6"
          />
          <circle
            cx="50"
            cy="50"
            r="34"
            fill="none"
            stroke={progressStroke}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 50 50)"
          />
          {/* Lock Icon */}
          <g
            transform="translate(37, 37) scale(1.1)"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={ICON_PATHS.Lock} />
          </g>
        </g>
      )}
    </svg>
  );
};

// Helper trigger to download achievement SVG directly to disk
export function downloadAchievementSvgFile({
  rarity,
  iconName = 'Trophy',
  unlocked = true,
  title = 'conquista',
  size = 512,
}: {
  rarity: GameRarity;
  iconName?: string;
  unlocked?: boolean;
  title?: string;
  size?: number;
}) {
  const svgMarkup = generateAchievementSvgString({
    rarity,
    iconName,
    unlocked,
    progress: 100,
    size,
  });

  const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = title.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  a.href = url;
  a.download = `orbitron_insignia_${rarity}_${safeName}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default AchievementBadgeSvg;
