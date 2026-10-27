import React, { useEffect, useState } from 'react';
import { OrbitLogo } from './OrbitLogo';
import { AppModule } from '../context/FinancialContext';

interface OrbitBootActivationProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

const PHASES: { module: AppModule | 'all'; title: string; label: string; colorClass: string; glow: string }[] = [
  {
    module: 'finance',
    title: 'FINANÇAS ESTELARES',
    label: 'Carregando contas, orçamentos e fluxo de caixa...',
    colorClass: 'text-emerald-400',
    glow: 'rgba(16, 185, 129, 0.25)',
  },
  {
    module: 'habits',
    title: 'HÁBITOS & CONSISTÊNCIA',
    label: 'Calculando sequências diárias e inteligência...',
    colorClass: 'text-cyan-400',
    glow: 'rgba(6, 182, 212, 0.25)',
  },
  {
    module: 'tools',
    title: 'SEGUNDO CÉREBRO & VAULT',
    label: 'Acessando notas, markdown e quadro branco local...',
    colorClass: 'text-purple-400',
    glow: 'rgba(168, 85, 247, 0.25)',
  },
  {
    module: 'journey',
    title: 'JORNADA CÓSMICA',
    label: 'Sincronizando sistema solar e evolução...',
    colorClass: 'text-amber-400',
    glow: 'rgba(245, 158, 11, 0.25)',
  },
  {
    module: 'all',
    title: 'ORBITRON PRONTO',
    label: 'Todos os 4 pilares carregados • 100% Local-First',
    colorClass: 'text-white',
    glow: 'rgba(255, 255, 255, 0.25)',
  },
];

export const OrbitBootActivation: React.FC<OrbitBootActivationProps> = ({ onComplete, forceShow = false }) => {
  const [visible, setVisible] = useState(() => {
    if (forceShow) return true;
    return !sessionStorage.getItem('orbit_boot_seen');
  });
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    if (!visible) return;

    sessionStorage.setItem('orbit_boot_seen', 'true');

    // Slower, graceful tempo: 2200ms per phase so the emergence of each color breathes majestically
    const timeouts: NodeJS.Timeout[] = [
      setTimeout(() => setPhaseIndex(1), 2200), // 2.2s -> Habits (Cyan)
      setTimeout(() => setPhaseIndex(2), 4400), // 4.4s -> Tools (Purple)
      setTimeout(() => setPhaseIndex(3), 6600), // 6.6s -> Journey (Amber)
      setTimeout(() => setPhaseIndex(4), 8800), // 8.8s -> Convergence (All 4)
      setTimeout(() => setFadingOut(true), 10600), // 10.6s -> Smooth Fade Out
      setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 11600), // 11.6s -> App Opens!
    ];

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [visible, onComplete]);

  if (!visible) return null;

  const currentPhase = PHASES[phaseIndex] || PHASES[0];

  const handleSkip = () => {
    setFadingOut(true);
    setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 200);
  };

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07090e] cursor-pointer transition-opacity duration-800 ease-out select-none ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Deep Space Starfield & Ambient Nebula */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full blur-3xl transition-all duration-1000 opacity-60"
          style={{ backgroundColor: currentPhase.glow }}
        />

        {/* Space Dust Stars */}
        <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-60" />
        <div className="absolute top-1/3 right-1/4 w-1 h-1 rounded-full bg-cyan-400 opacity-80" />
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 rounded-full bg-purple-400 opacity-70" />
        <div className="absolute bottom-1/4 right-1/3 w-1 h-1 rounded-full bg-amber-400 animate-ping opacity-60" />
      </div>

      {/* Main Activation Card */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md space-y-6">
        {/* Animated Símbolo Orbit (Emergence per color) */}
        <div className="relative flex items-center justify-center p-4">
          <div
            className="absolute inset-0 rounded-full blur-2xl transition-all duration-700 opacity-30"
            style={{ backgroundColor: currentPhase.glow }}
          />
          <OrbitLogo module={currentPhase.module} size={110} animated withGlow durationMs={2000} />
        </div>

        {/* Brand Title in Space Font */}
        <div className="space-y-1.5">
          <h1 className="font-orbit text-4xl sm:text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            ORBITRON
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400 font-orbit">
            {currentPhase.title}
          </p>
        </div>

        {/* 4 Spectrum Cumulative Indicators (Verde -> Azul -> Roxo -> Amarelo) */}
        <div className="flex items-center gap-2 pt-2">
          {[
            { idx: 0, mod: 'finance', color: 'bg-emerald-400 shadow-emerald-500/50' },
            { idx: 1, mod: 'habits', color: 'bg-cyan-400 shadow-cyan-500/50' },
            { idx: 2, mod: 'tools', color: 'bg-purple-400 shadow-purple-500/50' },
            { idx: 3, mod: 'journey', color: 'bg-amber-400 shadow-amber-500/50' },
          ].map((item) => {
            const isCompletedOrActive = phaseIndex >= item.idx || currentPhase.module === 'all';
            const isCurrent = phaseIndex === item.idx;
            return (
              <div
                key={item.mod}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  isCompletedOrActive
                    ? `${isCurrent ? 'w-10' : 'w-7'} ${item.color} shadow-[0_0_12px]`
                    : 'w-2 bg-slate-800'
                }`}
              />
            );
          })}
        </div>

        {/* Dynamic Status Text */}
        <p className={`text-xs font-semibold tracking-wide transition-all duration-500 ${currentPhase.colorClass}`}>
          {currentPhase.label}
        </p>

        {/* Skip Hint */}
        <span className="text-[10px] text-slate-500 hover:text-slate-300 transition pt-3">
          Clique em qualquer lugar para pular
        </span>
      </div>
    </div>
  );
};
