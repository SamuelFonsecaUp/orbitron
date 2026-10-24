import React from 'react';
import { AppModule } from '../context/FinancialContext';

export interface OrbitLogoProps {
  module?: AppModule | 'all';
  size?: number;
  className?: string;
  animated?: boolean;
  withGlow?: boolean;
}

const MODULE_COLORS: Record<AppModule, { primary: string; secondary: string; glow: string }> = {
  finance: {
    primary: '#10b981', // Verde Esmeralda
    secondary: '#34d399',
    glow: 'rgba(16, 185, 129, 0.45)',
  },
  habits: {
    primary: '#06b6d4', // Azul Ciano Cósmico
    secondary: '#38bdf8',
    glow: 'rgba(6, 182, 212, 0.45)',
  },
  tools: {
    primary: '#a855f7', // Roxo Estelar
    secondary: '#c084fc',
    glow: 'rgba(168, 85, 247, 0.45)',
  },
  journey: {
    primary: '#f59e0b', // Amarelo Solar / Dourado
    secondary: '#fbbf24',
    glow: 'rgba(245, 158, 11, 0.45)',
  },
};

export const OrbitLogo: React.FC<OrbitLogoProps> = ({
  module = 'finance',
  size = 32,
  className = '',
  animated = true,
  withGlow = true,
}) => {
  const isMulti = module === 'all';
  const colors = isMulti ? null : MODULE_COLORS[module] || MODULE_COLORS.finance;

  const primary = colors ? colors.primary : '#06b6d4';
  const secondary = colors ? colors.secondary : '#38bdf8';
  const glow = colors ? colors.glow : 'rgba(6, 182, 212, 0.5)';

  const filterId = `orbit-glow-${module}`;
  const gradId = `orbit-grad-${module}`;
  const multiGradId = `orbit-multi-grad`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-all duration-500 shrink-0 select-none ${className}`}
      style={{
        filter: withGlow ? `drop-shadow(0 0 8px ${glow})` : undefined,
      }}
    >
      <defs>
        {/* Glow Filter */}
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Dynamic Mono Gradient */}
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={secondary} />
          <stop offset="100%" stopColor={primary} />
        </linearGradient>

        {/* 4-Color Orbital Spectrum Gradient */}
        <linearGradient id={multiGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" /> {/* Verde */}
          <stop offset="33%" stopColor="#06b6d4" /> {/* Azul */}
          <stop offset="66%" stopColor="#a855f7" /> {/* Roxo */}
          <stop offset="100%" stopColor="#f59e0b" /> {/* Amarelo */}
        </linearGradient>
      </defs>

      {/* Orbit 1: Outer Primary Ring (Inclinada -28deg) */}
      <g
        className={animated ? 'animate-orbit-spin' : ''}
        style={{ transformOrigin: '50px 50px' }}
      >
        <ellipse
          cx="50"
          cy="50"
          rx="42"
          ry="19"
          transform="rotate(-28 50 50)"
          stroke={isMulti ? `url(#${multiGradId})` : primary}
          strokeWidth="3.2"
          strokeDasharray="180 30"
          strokeLinecap="round"
          className="transition-colors duration-500"
          opacity="0.85"
        />
        {/* Orbital Node 1 */}
        <circle
          cx="16"
          cy="32"
          r="3"
          fill={secondary}
          className="transition-colors duration-500"
        />
      </g>

      {/* Orbit 2: Inner Cross Ring (Inclinada 42deg) */}
      <g
        className={animated ? 'animate-orbit-spin-reverse' : ''}
        style={{ transformOrigin: '50px 50px' }}
      >
        <ellipse
          cx="50"
          cy="50"
          rx="36"
          ry="15"
          transform="rotate(42 50 50)"
          stroke={isMulti ? `url(#${multiGradId})` : secondary}
          strokeWidth="2.2"
          strokeDasharray="130 25"
          strokeLinecap="round"
          className="transition-colors duration-500"
          opacity="0.7"
        />
        {/* Orbital Node 2 */}
        <circle
          cx="76"
          cy="68"
          r="2.5"
          fill={primary}
          className="transition-colors duration-500"
        />
      </g>

      {/* Orbit 3: Horizon Arc */}
      <circle
        cx="50"
        cy="50"
        r="47"
        stroke={isMulti ? `url(#${multiGradId})` : primary}
        strokeWidth="1.2"
        strokeDasharray="12 28"
        strokeLinecap="round"
        opacity="0.4"
        className="transition-colors duration-500"
      />

      {/* Celestial Nucleus (Central Sphere) */}
      <circle
        cx="50"
        cy="50"
        r="13"
        fill={isMulti ? `url(#${multiGradId})` : `url(#${gradId})`}
        className={`transition-all duration-500 ${animated ? 'animate-celestial-pulse' : ''}`}
        style={{ transformOrigin: '50px 50px' }}
      />

      {/* Core Highlight specular reflection */}
      <circle
        cx="46"
        cy="46"
        r="4.5"
        fill="#ffffff"
        opacity="0.75"
        className="pointer-events-none"
      />
    </svg>
  );
};
