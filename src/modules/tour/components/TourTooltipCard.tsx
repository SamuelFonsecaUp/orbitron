import React, { useLayoutEffect, useState } from 'react';
import { Sparkles, CheckCircle2, ArrowRight, ArrowLeft, X, Rocket } from 'lucide-react';
import { TourStep } from '../types';

interface TourTooltipCardProps {
  step: TourStep;
  currentStepIndex: number;
  totalSteps: number;
  actionSuccess: boolean;
  coords: { x: number; y: number; width: number; height: number } | null;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

const PILLAR_STYLES: Record<string, { badge: string; border: string; glow: string; text: string }> = {
  emerald: {
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
    border: 'border-emerald-500/35',
    glow: 'shadow-[0_0_40px_rgba(16,185,129,0.22)]',
    text: 'text-emerald-400',
  },
  cyan: {
    badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/35',
    border: 'border-cyan-500/35',
    glow: 'shadow-[0_0_40px_rgba(6,182,212,0.25)]',
    text: 'text-cyan-400',
  },
  purple: {
    badge: 'bg-purple-500/15 text-purple-300 border-purple-500/35',
    border: 'border-purple-500/35',
    glow: 'shadow-[0_0_40px_rgba(168,85,247,0.22)]',
    text: 'text-purple-400',
  },
  amber: {
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
    border: 'border-amber-500/35',
    glow: 'shadow-[0_0_40px_rgba(245,158,11,0.22)]',
    text: 'text-amber-400',
  },
  blue: {
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
    border: 'border-sky-500/35',
    glow: 'shadow-[0_0_40px_rgba(14,165,233,0.22)]',
    text: 'text-sky-400',
  },
};

export const TourTooltipCard: React.FC<TourTooltipCardProps> = ({
  step,
  currentStepIndex,
  totalSteps,
  actionSuccess,
  coords,
  onNext,
  onPrev,
  onSkip,
}) => {
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 100, left: 100 });
  const isLast = currentStepIndex === totalSteps - 1;
  const pillarStyle = PILLAR_STYLES[step.pillarColor || 'cyan'] || PILLAR_STYLES.cyan;

  useLayoutEffect(() => {
    const CARD_WIDTH = 410;
    const CARD_HEIGHT = 280;
    const MARGIN = 18;
    const GAP = 16;

    if (!coords) {
      setPosition({
        left: Math.max(MARGIN, (window.innerWidth - CARD_WIDTH) / 2),
        top: Math.max(MARGIN, (window.innerHeight - CARD_HEIGHT) / 2),
      });
      return;
    }

    let placement = step.placement || 'auto';
    if (placement === 'auto') {
      if (coords.x + coords.width + CARD_WIDTH + GAP < window.innerWidth) placement = 'right';
      else if (coords.y + coords.height + CARD_HEIGHT + GAP < window.innerHeight) placement = 'bottom';
      else if (coords.y - CARD_HEIGHT - GAP > 0) placement = 'top';
      else placement = 'left';
    }

    let top = 0;
    let left = 0;

    switch (placement) {
      case 'right':
        left = coords.x + coords.width + GAP;
        top = coords.y + coords.height / 2 - CARD_HEIGHT / 2;
        break;
      case 'left':
        left = coords.x - CARD_WIDTH - GAP;
        top = coords.y + coords.height / 2 - CARD_HEIGHT / 2;
        break;
      case 'top':
        left = coords.x + coords.width / 2 - CARD_WIDTH / 2;
        top = coords.y - CARD_HEIGHT - GAP;
        break;
      case 'bottom':
      default:
        left = coords.x + coords.width / 2 - CARD_WIDTH / 2;
        top = coords.y + coords.height + GAP;
        break;
    }

    left = Math.max(MARGIN, Math.min(window.innerWidth - CARD_WIDTH - MARGIN, left));
    top = Math.max(MARGIN, Math.min(window.innerHeight - CARD_HEIGHT - MARGIN, top));

    setPosition({ left, top });
  }, [coords, step.placement]);

  return (
    <div
      style={{ left: `${position.left}px`, top: `${position.top}px` }}
      className={`fixed z-[9999] w-[410px] p-5 rounded-3xl bg-[#0a0d16]/95 border ${pillarStyle.border} ${pillarStyle.glow} backdrop-blur-2xl transition-all duration-400 ease-out select-none space-y-4`}
    >
      {/* Top Banner: Step Counter & Pillar Tag */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/[0.06] text-slate-300 border border-white/10 flex items-center gap-1.5">
            <Rocket className="w-3 h-3 text-cyan-400" />
            <span>Etapa {currentStepIndex + 1} de {totalSteps}</span>
          </span>

          {step.pillarBadge && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide border uppercase ${pillarStyle.badge}`}>
              {step.pillarBadge}
            </span>
          )}
        </div>

        <button
          onClick={onSkip}
          title="Sair do tour"
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Title & Detailed Explanation */}
      <div className="space-y-1.5">
        <h3 className="font-orbit text-sm font-black text-white tracking-wide flex items-center gap-2">
          <span>{step.title}</span>
          <Sparkles className={`w-3.5 h-3.5 ${pillarStyle.text} shrink-0`} />
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed font-sans font-normal">
          {step.description}
        </p>
      </div>

      {/* Interactive Action Prompt or Success Feedback */}
      {step.interactive && (
        <div
          className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 transition-all duration-300 ${
            actionSuccess
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
              : 'bg-white/[0.04] border-white/10 text-cyan-200'
          }`}
        >
          {actionSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
              <span>Ação executada com sucesso! Avançando...</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
              <span className="text-[11px] font-medium leading-tight">
                {step.actionHint || 'Execute a ação indicada no elemento real.'}
              </span>
            </>
          )}
        </div>
      )}

      {/* Footer Navigation */}
      <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentStepIndex
                  ? 'w-6 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                  : i < currentStepIndex
                  ? 'w-2 bg-emerald-400/80'
                  : 'w-2 bg-slate-800'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {currentStepIndex > 0 && (
            <button
              type="button"
              onClick={onPrev}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/[0.06] transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNext}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-cyan-600/25 active:scale-95 flex items-center gap-1.5"
          >
            <span>{isLast ? 'Concluir' : 'Próximo'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
