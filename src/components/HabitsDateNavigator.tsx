import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { useHabits } from '../context/HabitsContext';

export const HabitsDateNavigator: React.FC = () => {
  const { selectedDate, setSelectedDate } = useHabits();
  const todayStr = new Date().toISOString().slice(0, 10);

  const getShiftedDate = (baseStr: string, offsetDays: number): string => {
    const [y, m, d] = baseStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + offsetDays);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  };

  const yesterdayStr = getShiftedDate(todayStr, -1);
  const dayBeforeYesterdayStr = getShiftedDate(todayStr, -2);
  const isToday = selectedDate === todayStr;
  const isPast = selectedDate < todayStr;

  const formatDateLabel = (isoDate: string): string => {
    const [y, m, d] = isoDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm">
      {/* Date controls and navigation */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedDate(getShiftedDate(selectedDate, -1))}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Dia anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="relative flex items-center">
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-cyan-500/50 cursor-pointer transition text-xs font-bold text-white">
            <CalendarIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isToday ? 'Hoje' : selectedDate === yesterdayStr ? 'Ontem' : formatDateLabel(selectedDate)}</span>
            <input
              type="date"
              max={todayStr}
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
        </div>

        <button
          type="button"
          disabled={isToday}
          onClick={() => setSelectedDate(getShiftedDate(selectedDate, 1))}
          className={`p-1.5 rounded-xl transition ${
            isToday ? 'text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Próximo dia"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Quick pills */}
        <div className="hidden md:flex items-center gap-1 ml-2 text-[11px]">
          {[
            { label: 'Hoje', val: todayStr },
            { label: 'Ontem', val: yesterdayStr },
            { label: 'Anteontem', val: dayBeforeYesterdayStr },
          ].map((pill) => {
            const active = selectedDate === pill.val;
            return (
              <button
                key={pill.val}
                type="button"
                onClick={() => setSelectedDate(pill.val)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  active
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Retroactive notice badge */}
      {isPast && (
        <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
          <span className="font-medium">Modo Retroativo ({formatDateLabel(selectedDate)})</span>
          <button
            type="button"
            onClick={() => setSelectedDate(todayStr)}
            className="flex items-center gap-1 font-bold text-amber-200 hover:underline hover:text-amber-100"
          >
            <RotateCcw className="w-3 h-3" />
            Voltar para Hoje
          </button>
        </div>
      )}
    </div>
  );
};
