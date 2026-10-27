import React from 'react';
import { Clock, AlertTriangle, Check, Trash2, X } from 'lucide-react';
import { useTimeTracker, formatHumanDuration } from '../modules/timeTracker/timeTrackerStore';

export const IdleTimeDialog: React.FC = () => {
  const { idleNotice, clearIdleNotice, discardIdleSeconds, discard } = useTimeTracker();

  if (!idleNotice) return null;

  const idleMinutes = Math.floor(idleNotice.idleSeconds / 60);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Detecção de Inatividade
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mt-1">
              Você ficou ausente por {idleMinutes} min
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              O rastreador continuou ligado enquanto você estava longe na tarefa:
              <span className="font-semibold text-white block truncate mt-0.5">
                "{idleNotice.taskTitle}"
              </span>
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => clearIdleNotice()}
            className="w-full px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <Check className="w-4 h-4" />
            <span>Manter todo o tempo ({formatHumanDuration(idleNotice.idleSeconds)} trabalhados)</span>
          </button>

          <button
            type="button"
            onClick={() => discardIdleSeconds(idleNotice.idleSeconds)}
            className="w-full px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-white/10 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Descartar os {idleMinutes} min de inatividade</span>
          </button>

          <button
            type="button"
            onClick={() => discard()}
            className="w-full px-4 py-1.5 rounded-xl hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 text-[11px] font-medium flex items-center justify-center gap-1.5 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Descartar esta sessão inteira</span>
          </button>
        </div>
      </div>
    </div>
  );
};
