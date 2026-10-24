import React, { useEffect, useState } from 'react';
import { OrbitLogo } from './OrbitLogo';
import { AppModule } from '../context/FinancialContext';

interface OrbitBootActivationProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

const PHASES: { module: AppModule | 'all'; label: string; colorClass: string }[] = [
  { module: 'finance', label: 'Carregando Módulo Financeiro...', colorClass: 'text-emerald-400' },
  { module: 'habits', label: 'Conectando Hábitos & Consistência...', colorClass: 'text-cyan-400' },
  { module: 'tools', label: 'Acessando Segundo Cérebro & Vault...', colorClass: 'text-purple-400' },
  { module: 'journey', label: 'Iniciando Jornada Cósmica...', colorClass: 'text-amber-400' },
  { module: 'all', label: 'SISTEMA ORBIT PRONTO • 100% LOCAL-FIRST', colorClass: 'text-white' },
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

    // Cycle through the 4 modules and then convergence
    const intervals = [350, 350, 350, 350, 600];
    let step = 0;

    const timer = setInterval(() => {
      step++;
      if (step < PHASES.length) {
        setPhaseIndex(step);
      } else {
        clearInterval(timer);
        setFadingOut(true);
        setTimeout(() => {
          setVisible(false);
          onComplete?.();
        }, 500);
      }
    }, intervals[step] || 400);

    return () => clearInterval(timer);
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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07090e] cursor-pointer transition-opacity duration-500 select-none ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Deep Space Starfield & Celestial Nebula */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-600/15 via-purple-600/15 to-amber-500/15 rounded-full blur-3xl opacity-60 animate-pulse" />
        
        {/* Decorative Space Dust Particles */}
        <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-60" />
        <div className="absolute top-1/3 right-1/4 w-1 h-1 rounded-full bg-cyan-400 opacity-80" />
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 rounded-full bg-purple-400 opacity-70" />
        <div className="absolute bottom-1/4 right-1/3 w-1 h-1 rounded-full bg-amber-400 animate-ping opacity-60" />
      </div>

      {/* Main Activation Card */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md space-y-6">
        {/* Animated Símbolo Orbit */}
        <div className="relative flex items-center justify-center p-4">
          <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-xl animate-ping opacity-25" />
          <OrbitLogo module={currentPhase.module} size={110} animated withGlow />
        </div>

        {/* Space Font Brand Title */}
        <div className="space-y-1.5">
          <h1 className="font-orbit text-4xl sm:text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            ORBIT
          </h1>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 font-orbit">
            SISTEMA OPERACIONAL PESSOAL
          </p>
        </div>

        {/* 4 Spectrum Indicators (Verde, Azul, Roxo, Amarelo) */}
        <div className="flex items-center gap-2 pt-2">
          {[
            { mod: 'finance', color: 'bg-emerald-400 shadow-emerald-500/50' },
            { mod: 'habits', color: 'bg-cyan-400 shadow-cyan-500/50' },
            { mod: 'tools', color: 'bg-purple-400 shadow-purple-500/50' },
            { mod: 'journey', color: 'bg-amber-400 shadow-amber-500/50' },
          ].map((item, idx) => {
            const isActive = currentPhase.module === 'all' || currentPhase.module === item.mod;
            return (
              <div
                key={item.mod}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isActive ? `w-8 ${item.color} shadow-[0_0_10px]` : 'w-2 bg-slate-800'
                }`}
              />
            );
          })}
        </div>

        {/* Dynamic Status Text */}
        <p className={`text-xs font-semibold tracking-wide transition-all duration-300 ${currentPhase.colorClass}`}>
          {currentPhase.label}
        </p>

        {/* Skip Hint */}
        <span className="text-[10px] text-slate-500 hover:text-slate-400 transition pt-4">
          Clique em qualquer lugar para entrar
        </span>
      </div>
    </div>
  );
};
