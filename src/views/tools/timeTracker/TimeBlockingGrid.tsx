import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Columns,
  Maximize2,
  Minimize2,
  Plus,
  Tag,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { TimeEntry, TimeWorkType, TIME_WORK_TYPES, TimeCategory } from '../../../modules/timeTracker/types';
import { formatHumanDuration } from '../../../modules/timeTracker/timeTrackerStore';

interface TimeBlockingGridProps {
  entries: TimeEntry[];
  categories: TimeCategory[];
  activeRunning?: {
    taskTitle: string;
    startedAt: number;
    category: string;
    workType?: TimeWorkType;
    elapsedSeconds: number;
  } | null;
  onEditEntry: (entry: TimeEntry) => void;
  onAddManual: (date: string, hourStr: string) => void;
}

export const TimeBlockingGrid: React.FC<TimeBlockingGridProps> = ({
  entries,
  categories,
  activeRunning,
  onEditEntry,
  onAddManual,
}) => {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isFull24h, setIsFull24h] = useState(false);
  const [viewMode, setViewMode] = useState<'lanes' | 'unified'>('lanes');
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now());

  // Update real-time clock indicator every 30s
  useEffect(() => {
    const timer = setInterval(() => setNowTimestamp(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const startHour = isFull24h ? 0 : 6;
  const endHour = isFull24h ? 24 : 23;
  const totalHours = endHour - startHour;
  const totalMinutes = totalHours * 60;
  const startMinuteOfDay = startHour * 60;

  const hoursList = useMemo(() => {
    const list: number[] = [];
    for (let h = startHour; h < endHour; h++) {
      list.push(h);
    }
    return list;
  }, [startHour, endHour]);

  // Filter entries for the selected day
  const dayEntries = useMemo(() => {
    return entries.filter((e) => {
      const d = new Date(e.startedAt);
      const pad = (n: number) => String(n).padStart(2, '0');
      const entryDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      return entryDate === selectedDate;
    });
  }, [entries, selectedDate]);

  const isToday = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return selectedDate === todayStr;
  }, [selectedDate]);

  // Current time line position
  const currentTimePosition = useMemo(() => {
    if (!isToday) return null;
    const now = new Date(nowTimestamp);
    const currentMins = now.getHours() * 60 + now.getMinutes();
    if (currentMins < startMinuteOfDay || currentMins > endHour * 60) return null;
    const offsetMins = currentMins - startMinuteOfDay;
    return (offsetMins / totalMinutes) * 100;
  }, [isToday, nowTimestamp, startMinuteOfDay, totalMinutes, endHour]);

  // Category Color Helper
  const getCatColor = (catName?: string) => {
    const found = categories.find((c) => c.name.toLowerCase() === (catName || '').toLowerCase());
    return found ? found.color : '#06b6d4';
  };

  const navigateDay = (delta: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + delta);
    const pad = (n: number) => String(n).padStart(2, '0');
    setSelectedDate(`${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`);
  };

  const setToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const formatDayTitle = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const dayName = dt.toLocaleDateString('pt-BR', { weekday: 'long' });
    const formattedDate = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${formattedDate}`;
  };

  const computeBlockStyle = (startedAt: number, durationSeconds: number) => {
    const startDate = new Date(startedAt);
    const entryStartMins = startDate.getHours() * 60 + startDate.getMinutes();
    const durationMins = Math.max(5, Math.round(durationSeconds / 60));

    const offsetMins = Math.max(0, entryStartMins - startMinuteOfDay);
    const topPercent = (offsetMins / totalMinutes) * 100;
    const heightPercent = Math.max(1.8, (durationMins / totalMinutes) * 100);

    return {
      top: `${topPercent}%`,
      height: `calc(${heightPercent}% - 3px)`,
    };
  };

  const getWorkTypeBadge = (wt?: TimeWorkType) => {
    switch (wt) {
      case 'Profissional - Freela':
        return { label: 'Freela', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'Projeto Pessoal':
        return { label: 'Pessoal', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      default:
        return { label: 'Contratado', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
    }
  };

  // Render a block inside lane or unified column
  const renderBlock = (entry: TimeEntry) => {
    const style = computeBlockStyle(entry.startedAt, entry.durationSeconds);
    const color = getCatColor(entry.category);
    const badge = getWorkTypeBadge(entry.workType);

    const startDate = new Date(entry.startedAt);
    const endDate = new Date(entry.endedAt || entry.startedAt + entry.durationSeconds * 1000);
    const timeRangeStr = `${startDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })} - ${endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

    return (
      <div
        key={entry.id}
        onClick={() => onEditEntry(entry)}
        className="absolute left-1 right-1 rounded-xl p-2.5 cursor-pointer shadow-lg transition-all hover:scale-[1.01] hover:z-30 overflow-hidden flex flex-col justify-between group border select-none"
        style={{
          ...style,
          backgroundColor: `${color}18`,
          borderColor: `${color}55`,
          borderLeftWidth: '4px',
          borderLeftColor: color,
        }}
        title={`${entry.taskTitle} (${timeRangeStr}) — Clique para editar`}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-white truncate group-hover:text-cyan-300 transition">
              {entry.taskTitle}
            </span>
            <span
              className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border ${badge.bg}`}
            >
              {badge.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 font-mono">
            <span>{timeRangeStr}</span>
            <span>•</span>
            <span className="font-bold text-slate-300">{formatHumanDuration(entry.durationSeconds)}</span>
          </div>
        </div>

        {entry.notes && (
          <p className="text-[10px] text-slate-400/80 truncate mt-1 italic">{entry.notes}</p>
        )}
      </div>
    );
  };

  const totalDaySeconds = dayEntries.reduce((acc, e) => acc + e.durationSeconds, 0);

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 flex flex-col space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Calendar className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">Grade Diária de Time Blocking</h2>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
              Blocos Visuais
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visualização contínua do seu dia. Clique em qualquer bloco para editar ou em horários vazios para lançar.
          </p>
        </div>

        {/* Date Navigator Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-950 border border-white/10 rounded-xl p-1">
            <button
              type="button"
              onClick={() => navigateDay(-1)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Dia anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={setToday}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                isToday
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => navigateDay(1)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="Próximo dia"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition font-medium"
          />

          {/* Toggle View Mode: Lanes vs Unified */}
          <div className="flex items-center bg-slate-950 border border-white/10 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setViewMode('lanes')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                viewMode === 'lanes'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="3 Raias: Contratado, Freela e Pessoal"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Raias</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('unified')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                viewMode === 'unified'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Fluxo Unificado contínuo"
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unificado</span>
            </button>
          </div>

          {/* Toggle 24h vs Active hours */}
          <button
            type="button"
            onClick={() => setIsFull24h(!isFull24h)}
            className="p-2 rounded-xl bg-slate-950 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={isFull24h ? 'Exibir horário ativo (06h - 23h)' : 'Exibir 24 horas completas'}
          >
            {isFull24h ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Date Banner & Total Focus Summary */}
      <div className="flex items-center justify-between text-xs px-2 py-1">
        <span className="text-white font-bold text-sm">{formatDayTitle()}</span>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Total Focado no Dia:</span>
          <span className="text-cyan-400 font-mono font-bold text-sm">
            {formatHumanDuration(totalDaySeconds)}
          </span>
          <span className="text-slate-500">({dayEntries.length} sessões)</span>
        </div>
      </div>

      {/* Main Timeline Grid Canvas */}
      <div className="relative border border-white/10 rounded-2xl bg-slate-950/80 overflow-hidden min-h-[640px] flex">
        {/* Left Time Axis Labels */}
        <div className="w-16 shrink-0 border-r border-white/10 select-none bg-slate-950/90 py-2">
          {hoursList.map((h) => (
            <div
              key={h}
              className="text-right pr-2.5 text-[11px] font-mono text-slate-400 relative"
              style={{ height: `${100 / totalHours}%` }}
            >
              <span className="-top-2 relative">{String(h).padStart(2, '0')}:00</span>
            </div>
          ))}
        </div>

        {/* Content Area with Hour Grid Lines */}
        <div className="flex-1 relative flex">
          {/* Background Horizontal Grid Lines */}
          <div className="absolute inset-0 pointer-events-none flex flex-col">
            {hoursList.map((h) => (
              <div
                key={h}
                className="w-full border-b border-white/[0.05] relative"
                style={{ height: `${100 / totalHours}%` }}
              >
                {/* 30-min dashed line */}
                <div className="absolute top-1/2 left-0 right-0 border-b border-white/[0.02] border-dashed" />
              </div>
            ))}
          </div>

          {/* Current Time Horizontal Line */}
          {currentTimePosition !== null && (
            <div
              className="absolute left-0 right-0 z-40 flex items-center pointer-events-none"
              style={{ top: `${currentTimePosition}%` }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4] -ml-1.5" />
              <div className="flex-1 border-t-2 border-cyan-400 shadow-[0_0_8px_#06b6d4]" />
              <span className="bg-cyan-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-md mr-2 shadow-lg">
                Agora {new Date(nowTimestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}

          {/* View Modes Rendering */}
          {viewMode === 'lanes' ? (
            // 3 Parallel Lanes for WorkTypes
            <div className="flex-1 flex divide-x divide-white/5 relative z-10">
              {TIME_WORK_TYPES.map((wt) => {
                const laneEntries = dayEntries.filter((e) => (e.workType || 'Profissional - Contratado') === wt);

                return (
                  <div key={wt} className="flex-1 relative group/lane">
                    {/* Lane Header */}
                    <div className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-sm border-b border-white/5 px-3 py-1.5 flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-300 truncate">{wt}</span>
                      <span className="text-slate-500 font-mono text-[10px]">
                        {formatHumanDuration(laneEntries.reduce((s, e) => s + e.durationSeconds, 0))}
                      </span>
                    </div>

                    {/* Empty Slots Clickable Area */}
                    <div
                      className="absolute inset-0 top-8 cursor-crosshair"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickY = e.clientY - rect.top;
                        const pct = clickY / rect.height;
                        const clickedMins = startMinuteOfDay + pct * totalMinutes;
                        const h = Math.floor(clickedMins / 60);
                        onAddManual(selectedDate, `${String(h).padStart(2, '0')}:00`);
                      }}
                      title="Clique no espaço vazio para criar um lançamento"
                    />

                    {/* Lane Blocks */}
                    <div className="absolute inset-0 top-8">
                      {laneEntries.map(renderBlock)}

                      {/* Active running timer block in this lane */}
                      {isToday &&
                        activeRunning &&
                        (activeRunning.workType || 'Profissional - Contratado') === wt && (
                          <div
                            className="absolute left-1 right-1 rounded-xl p-2.5 shadow-xl animate-pulse z-30 border select-none overflow-hidden"
                            style={{
                              ...computeBlockStyle(activeRunning.startedAt, activeRunning.elapsedSeconds),
                              backgroundColor: `${getCatColor(activeRunning.category)}35`,
                              borderColor: '#06b6d4',
                              borderLeftWidth: '4px',
                              borderLeftColor: '#06b6d4',
                            }}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                              <span className="text-xs font-black text-cyan-300 truncate">
                                {activeRunning.taskTitle}
                              </span>
                            </div>
                            <div className="text-[10px] text-cyan-200/90 font-mono mt-0.5 font-bold">
                              {formatHumanDuration(activeRunning.elapsedSeconds)} (em andamento)
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Unified Column Stream
            <div className="flex-1 relative z-10">
              {/* Empty Space Click Area */}
              <div
                className="absolute inset-0 cursor-crosshair"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickY = e.clientY - rect.top;
                  const pct = clickY / rect.height;
                  const clickedMins = startMinuteOfDay + pct * totalMinutes;
                  const h = Math.floor(clickedMins / 60);
                  onAddManual(selectedDate, `${String(h).padStart(2, '0')}:00`);
                }}
                title="Clique no espaço vazio para criar um lançamento"
              />

              {/* Render all entries stacked/positioned */}
              <div className="absolute inset-0">{dayEntries.map(renderBlock)}</div>

              {/* Active running timer block in unified stream */}
              {isToday && activeRunning && (
                <div
                  className="absolute left-2 right-2 rounded-xl p-2.5 shadow-xl animate-pulse z-30 border select-none overflow-hidden"
                  style={{
                    ...computeBlockStyle(activeRunning.startedAt, activeRunning.elapsedSeconds),
                    backgroundColor: `${getCatColor(activeRunning.category)}35`,
                    borderColor: '#06b6d4',
                    borderLeftWidth: '4px',
                    borderLeftColor: '#06b6d4',
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span className="text-xs font-black text-cyan-300 truncate">
                      {activeRunning.taskTitle}
                    </span>
                  </div>
                  <div className="text-[10px] text-cyan-200/90 font-mono mt-0.5 font-bold">
                    {formatHumanDuration(activeRunning.elapsedSeconds)} (em andamento)
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
