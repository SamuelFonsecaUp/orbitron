import React from 'react';

interface SpotlightCoords {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
}

interface TourSpotlightOverlayProps {
  coords: SpotlightCoords | null;
  interactive?: boolean;
  onBackdropClick?: () => void;
}

export const TourSpotlightOverlay: React.FC<TourSpotlightOverlayProps> = ({
  coords,
  interactive = false,
  onBackdropClick,
}) => {
  return (
    <div className="fixed inset-0 z-[9990] pointer-events-none overflow-hidden select-none">
      {/* SVG Mask Backdrop */}
      <svg
        className="w-full h-full absolute inset-0 pointer-events-auto"
        onClick={onBackdropClick}
      >
        <defs>
          <mask id="orbitron-spotlight-mask">
            {/* White covers entire viewport (visible backdrop) */}
            <rect width="100%" height="100%" fill="white" />
            {/* Black cutout creates the transparent spotlight hole */}
            {coords && (
              <rect
                x={coords.x}
                y={coords.y}
                width={coords.width}
                height={coords.height}
                rx={coords.radius}
                fill="black"
                className="transition-all duration-500 ease-out"
              />
            )}
          </mask>

          {/* Radial cosmic glow filter for the spotlight frame */}
          <filter id="spotlight-cyan-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Semi-transparent dark cosmic layer */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(5, 7, 14, 0.82)"
          mask="url(#orbitron-spotlight-mask)"
        />

        {/* Glowing border framing the active element */}
        {coords && (
          <g className="transition-all duration-500 ease-out pointer-events-none">
            {/* Outer subtle halo */}
            <rect
              x={coords.x - 2}
              y={coords.y - 2}
              width={coords.width + 4}
              height={coords.height + 4}
              rx={coords.radius + 2}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
              strokeOpacity="0.4"
              filter="url(#spotlight-cyan-glow)"
            />
            {/* Sharp inner luminous rim */}
            <rect
              x={coords.x}
              y={coords.y}
              width={coords.width}
              height={coords.height}
              rx={coords.radius}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
              className="animate-pulse"
            />
          </g>
        )}
      </svg>

      {/* Interactive Pass-through Zone: allows native clicks on the real element */}
      {coords && interactive && (
        <div
          style={{
            position: 'absolute',
            left: coords.x,
            top: coords.y,
            width: coords.width,
            height: coords.height,
            pointerEvents: 'none', // Allows clicks to penetrate through to DOM behind it
          }}
          className="z-[9995]"
        />
      )}
    </div>
  );
};
