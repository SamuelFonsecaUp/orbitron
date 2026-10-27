import React, { useState } from 'react';
import {
  Calendar,
  CheckSquare,
  Clock,
  MoreHorizontal,
  Play,
  Trash2,
  Edit2,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { KanbanTask, KanbanColumn, KanbanPriority } from '../../../modules/kanban/types';
import { kanbanStore } from '../../../modules/kanban/kanbanStore';
import { pomodoroStore } from '../../../modules/pomodoro/pomodoroStore';
import { useTimeTracker } from '../../../modules/timeTracker/timeTrackerStore';
import { useFinancial } from '../../../context/FinancialContext';

interface KanbanCardProps {
  task: KanbanTask;
  columns: KanbanColumn[];
  onEdit: (task: KanbanTask) => void;
}

const PRIORITY_THEME: Record<KanbanPriority, { label: string; bg: string; text: string; border: string }> = {
  low: { label: 'Baixa', bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20' },
  medium: { label: 'Média', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  high: { label: 'Alta', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/25' },
  urgent: { label: 'Urgente', bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
};

export const KanbanCard: React.FC<KanbanCardProps> = ({ task, columns, onEdit }) => {
  const { showToast } = useFinancial();
  const [menuOpen, setMenuOpen] = useState(false);

  const {
    isRunning: isTrackerRunning,
    activeTaskId,
    formattedTime,
    startTracking,
    pauseTracking,
  } = useTimeTracker();

  const isCurrentTracking = activeTaskId === task.id;
  const isCurrentTrackingRunning = isCurrentTracking && isTrackerRunning;

  const handleToggleTimeTracker = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentTrackingRunning) {
      pauseTracking();
      showToast(`Pausado rastreamento de "${task.title}".`, 'info');
    } else {
      startTracking(task.title, task.id, task.tags?.[0] || 'Geral');
      showToast(`⏱️ Rastreador iniciado para "${task.title}"!`, 'success');
    }
  };

  const priorityMeta = PRIORITY_THEME[task.priority] || PRIORITY_THEME.medium;

  // Due date checks
  const isOverdue = task.dueDate && new Date(task.dueDate + 'T23:59:59') < new Date();

  // Subtasks progress
  const totalSubtasks = task.subtasks.length;
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;

  const handleStartPomodoro = (e: React.MouseEvent) => {
    e.stopPropagation();
    pomodoroStore.linkTask(task.id, task.title);
    pomodoroStore.setMode('focus');
    pomodoroStore.start();
    showToast(`🍅 Pomodoro iniciado para "${task.title}"!`, 'success');
  };

  const handleMoveToColumn = (targetColId: string) => {
    kanbanStore.moveTask(task.id, targetColId);
    setMenuOpen(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Excluir a tarefa "${task.title}"?`)) {
      kanbanStore.deleteTask(task.id);
      showToast('Tarefa excluída.', 'info');
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={() => onEdit(task)}
      className={`p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border shadow-md hover:shadow-xl transition-all cursor-grab active:cursor-grabbing group relative select-none space-y-2.5 ${
        isCurrentTrackingRunning
          ? 'border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.18)] bg-slate-900/95'
          : 'border-slate-800 hover:border-slate-700/80'
      }`}
    >
      {/* Top Header: Priority Badge & Options */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${priorityMeta.bg} ${priorityMeta.text} ${priorityMeta.border}`}
        >
          {priorityMeta.label}
        </span>

        <div className="flex items-center gap-1">
          {/* Quick Toggle Time Tracker */}
          <button
            type="button"
            onClick={handleToggleTimeTracker}
            className={`p-1 rounded-lg transition ${
              isCurrentTrackingRunning
                ? 'bg-cyan-500/25 text-cyan-300 hover:bg-cyan-500/35'
                : 'hover:bg-cyan-500/10 text-slate-400 hover:text-cyan-400'
            }`}
            title={
              isCurrentTrackingRunning
                ? 'Pausar rastreador de tempo'
                : 'Iniciar rastreador de tempo nesta tarefa'
            }
          >
            <Clock className={`w-3 h-3 ${isCurrentTrackingRunning ? 'animate-pulse' : ''}`} />
          </button>

          {/* Quick Start Pomodoro on Card */}
          <button
            type="button"
            onClick={handleStartPomodoro}
            className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
            title="Iniciar Pomodoro nesta tarefa"
          >
            <Play className="w-3 h-3 fill-current" />
          </button>

          {/* More actions menu */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
              title="Ações da tarefa"
            >
              <MoreHorizontal className="w-3 h-3" />
            </button>

            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-7 right-0 w-44 rounded-xl bg-slate-950/95 border border-slate-800 p-1.5 shadow-2xl z-30 space-y-1 text-xs backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
              >
                <button
                  onClick={() => {
                    onEdit(task);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 transition text-left"
                >
                  <Edit2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Editar Tarefa</span>
                </button>

                {/* Move to another column */}
                <div className="pt-1 border-t border-white/10">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block px-2 mb-1">
                    Mover para:
                  </span>
                  {columns
                    .filter((c) => c.id !== task.columnId)
                    .map((col) => (
                      <button
                        key={col.id}
                        onClick={() => handleMoveToColumn(col.id)}
                        className="w-full flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/10 text-slate-300 text-left text-[11px]"
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                        <span className="truncate">{col.title}</span>
                      </button>
                    ))}
                </div>

                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 transition text-left border-t border-white/10 pt-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Title */}
      <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition leading-snug">
        {task.title}
      </h4>

      {/* Description preview */}
      {task.description && (
        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.map((tag, i) => (
            <span
              key={i}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Checklist / Subtasks Indicator */}
      {totalSubtasks > 0 && (
        <div className="pt-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span className="flex items-center gap-1 font-medium">
              <CheckSquare className="w-3 h-3 text-purple-400" />
              <span>Subtarefas</span>
            </span>
            <span className="font-mono">
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Live Time Tracker banner on card */}
      {isCurrentTracking && (
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 text-[11px] font-mono font-bold">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isTrackerRunning ? 'bg-cyan-400 animate-ping' : 'bg-amber-400'
              }`}
            />
            <span>{isTrackerRunning ? 'Rastreando:' : 'Pausado:'}</span>
          </span>
          <span className="font-bold">{formattedTime}</span>
        </div>
      )}

      {/* Footer Info: Due Date & Pomodoros */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-slate-400">
        {/* Due date */}
        {task.dueDate ? (
          <span
            className={`flex items-center gap-1 font-medium ${
              isOverdue ? 'text-rose-400 font-bold' : 'text-slate-400'
            }`}
            title={isOverdue ? 'Prazo vencido!' : `Prazo: ${task.dueDate}`}
          >
            {isOverdue ? (
              <AlertCircle className="w-3 h-3 text-rose-400" />
            ) : (
              <Calendar className="w-3 h-3" />
            )}
            <span>{task.dueDate.split('-').reverse().slice(0, 2).join('/')}</span>
          </span>
        ) : (
          <span />
        )}

        {/* Pomodoros counter */}
        {(task.pomodorosEstimated > 0 || task.pomodorosCompleted > 0) && (
          <span
            className="flex items-center gap-1 font-mono font-bold text-rose-300 bg-rose-500/10 px-1.5 py-0.5 rounded-md border border-rose-500/20"
            title={`Pomodoros: ${task.pomodorosCompleted} concluídos de ${task.pomodorosEstimated || 0} estimados`}
          >
            <span>🍅</span>
            <span>
              {task.pomodorosCompleted}/{task.pomodorosEstimated || '?'}
            </span>
          </span>
        )}
      </div>
    </div>
  );
};
