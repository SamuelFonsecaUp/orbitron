import React from 'react';

export const SolarSystemBackground: React.FC = () => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none z-0">
      {/* Deep Space Background Gradient & Nebula */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#060810] via-[#090d18] to-[#07090f] opacity-90" />
      <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-1/4 -left-1/4 w-[700px] h-[700px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* SVG Solar System: Sun & Planetary Orbits */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[960px] h-[960px] opacity-40">
        <svg
          viewBox="0 0 1000 1000"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Sun Radial Glow */}
            <radialGradient id="sun-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="35%" stopColor="#f59e0b" />
              <stop offset="75%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="0.8" />
            </radialGradient>
            <radialGradient id="sun-flare" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.6" />
              <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Central Sun */}
          <circle cx="500" cy="500" r="55" fill="url(#sun-flare)" className="animate-pulse" />
          <circle cx="500" cy="500" r="28" fill="url(#sun-core)" filter="drop-shadow(0 0 20px #f59e0b)" />

          {/* 1. Mercúrio (Radius: 75) */}
          <circle cx="500" cy="500" r="75" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 6" />
          <g style={{ transformOrigin: '500px 500px', animation: 'orbit-spin 12s linear infinite' }}>
            <circle cx="575" cy="500" r="3" fill="#cbd5e1" filter="drop-shadow(0 0 4px #94a3b8)" />
          </g>

          {/* 2. Vênus (Radius: 115) */}
          <circle cx="500" cy="500" r="115" stroke="rgba(255,255,255,0.07)" strokeDasharray="5 7" />
          <g style={{ transformOrigin: '500px 500px', animation: 'orbit-spin 18s linear infinite' }}>
            <circle cx="500" cy="385" r="4.5" fill="#fde68a" filter="drop-shadow(0 0 5px #fde68a)" />
          </g>

          {/* 3. Terra com Lua (Radius: 165) */}
          <circle cx="500" cy="500" r="165" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="1.2" strokeDasharray="6 8" />
          <g style={{ transformOrigin: '500px 500px', animation: 'orbit-spin 26s linear infinite' }}>
            {/* Terra */}
            <circle cx="335" cy="500" r="6" fill="#38bdf8" filter="drop-shadow(0 0 8px #0284c7)" />
            {/* Lua */}
            <circle cx="324" cy="494" r="1.5" fill="#e2e8f0" />
          </g>

          {/* 4. Marte (Radius: 215) */}
          <circle cx="500" cy="500" r="215" stroke="rgba(255,255,255,0.06)" strokeDasharray="6 9" />
          <g style={{ transformOrigin: '500px 500px', animation: 'orbit-spin 34s linear infinite' }}>
            <circle cx="500" cy="715" r="4" fill="#f87171" filter="drop-shadow(0 0 6px #ef4444)" />
          </g>

          {/* Asteroid Belt hint */}
          <circle cx="500" cy="500" r="260" stroke="rgba(255,255,255,0.04)" strokeDasharray="1 8" strokeWidth="2" />

          {/* 5. Júpiter (Radius: 310) */}
          <circle cx="500" cy="500" r="310" stroke="rgba(251, 191, 36, 0.12)" strokeWidth="1.3" strokeDasharray="8 12" />
          <g style={{ transformOrigin: '500px 500px', animation: 'orbit-spin 48s linear infinite' }}>
            <circle cx="719" cy="281" r="12" fill="#fbbf24" filter="drop-shadow(0 0 12px #d97706)" />
            <ellipse cx="719" cy="281" rx="12" ry="3" fill="#b45309" opacity="0.4" />
          </g>

          {/* 6. Saturno com Anéis (Radius: 375) */}
          <circle cx="500" cy="500" r="375" stroke="rgba(255,255,255,0.06)" strokeDasharray="8 14" />
          <g style={{ transformOrigin: '500px 500px', animation: 'orbit-spin 64s linear infinite' }}>
            {/* Anéis de Saturno */}
            <ellipse cx="235" cy="500" rx="18" ry="6" stroke="#fef08a" strokeWidth="2.2" opacity="0.8" transform="rotate(-25 235 500)" />
            {/* Saturno */}
            <circle cx="235" cy="500" r="9" fill="#fef08a" filter="drop-shadow(0 0 8px #eab308)" />
          </g>

          {/* 7. Urano (Radius: 430) */}
          <circle cx="500" cy="500" r="430" stroke="rgba(255,255,255,0.05)" strokeDasharray="10 16" />
          <g style={{ transformOrigin: '500px 500px', animation: 'orbit-spin 80s linear infinite' }}>
            <circle cx="500" cy="930" r="7" fill="#67e8f9" filter="drop-shadow(0 0 8px #06b6d4)" />
          </g>

          {/* 8. Netuno (Radius: 480) */}
          <circle cx="500" cy="500" r="480" stroke="rgba(59, 130, 246, 0.08)" strokeDasharray="10 18" />
          <g style={{ transformOrigin: '500px 500px', animation: 'orbit-spin 100s linear infinite' }}>
            <circle cx="839" cy="500" r="6.5" fill="#3b82f6" filter="drop-shadow(0 0 9px #2563eb)" />
          </g>
        </svg>
      </div>

      {/* Floating Constellation Stars */}
      <div className="absolute inset-0 pointer-events-none opacity-50">
        <div className="absolute top-[12%] left-[18%] w-1 h-1 rounded-full bg-white opacity-60 animate-pulse" />
        <div className="absolute top-[28%] right-[22%] w-1 h-1 rounded-full bg-cyan-200 opacity-80" />
        <div className="absolute bottom-[20%] left-[25%] w-1.5 h-1.5 rounded-full bg-amber-200 opacity-50 animate-pulse" />
        <div className="absolute top-[75%] right-[15%] w-1 h-1 rounded-full bg-purple-200 opacity-70" />
        <div className="absolute top-[45%] left-[8%] w-1 h-1 rounded-full bg-white opacity-40" />
      </div>
    </div>
  );
};
