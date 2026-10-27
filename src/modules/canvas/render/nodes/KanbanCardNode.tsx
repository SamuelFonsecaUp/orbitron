import React, { useState } from 'react';
import { CanvasNode, CanvasSide } from '../../io/jsonCanvas.types';
import { getCanvasColor } from '../colors';
import { Point, Rect } from '../../scene/types';
import { NodeHotspots } from './NodeHotspots';
import { CanvasTheme } from '../../store/canvasStore.types';
import { useKanbanStore, kanbanStore } from '../../../kanban/kanbanStore';
import { Check, CheckCircle2, Circle, Flame, Tag, ExternalLink, Columns } from 'lucide-react';

interface KanbanCardNodeProps {
  node: CanvasNode;
  effectiveRect: Rect;
  effectiveRotation: number;
  isSelected: boolean;
  theme?: CanvasTheme;
  isTargetCandidate?: boolean;
  targetSide?: CanvasSide;
  isConnecting?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onAnchorPointerDown?: (e: React.PointerEvent, side: CanvasSide, pt: Point) => void;
}

export const KanbanCardNode: React.FC<KanbanCardNodeProps> = ({
  node,
  effectiveRect,
  effectiveRotation,
  isSelected,
  theme = 'dark',
  isTargetCandidate,
  targetSide,
  isConnecting,
  onPointerDown,
  onDoubleClick,
  onAnchorPointerDown,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { x, y, width: w, height: h } = effectiveRect;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const isLight = theme === 'light';

  // Read live task and columns from Kanban Store
  const taskId = node.orbitron?.taskId;
  const tasks = useKanbanStore((s) => s.tasks);
  const columns = useKanbanStore((s) => s.columns);

  const liveTask = taskId ? tasks.find((t) => t.id === taskId) : null;
  const taskTitle = liveTask?.title || node.orbitron?.taskTitle || node.text || 'Tarefa Kanban';
  const columnId = liveTask?.columnId || node.orbitron?.taskColumnId || 'col-todo';
  const priority = liveTask?.priority || node.orbitron?.taskPriority || 'medium';

  const currentColumn = columns.find((c) => c.id === columnId) || {
    id: columnId,
    title: columnId === 'col-done' ? 'Concluído' : 'A Fazer',
    color: columnId === 'col-done' ? '#34d399' : '#38bdf8',
  };

  const isDone = columnId === 'col-done';

  const handleToggleDone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!taskId) return;
    if (isDone) {
      kanbanStore.moveTask(taskId, 'col-todo');
    } else {
      kanbanStore.moveTask(taskId, 'col-done');
    }
  };

  const handleOpenKanban = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent('orbitron:navigate', { detail: { view: 'tools_kanban' } })
    );
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'urgent':
        return { label: 'Urgente', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      case 'high':
        return { label: 'Alta', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'medium':
        return { label: 'Média', bg: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
      default:
        return { label: 'Baixa', bg: 'bg-slate-500/20 text-slate-300 border-slate-500/30' };
    }
  };

  const prio = getPriorityBadge(priority);
  const colColor = currentColumn.color || '#38bdf8';

  return (
    <g
      transform={`rotate(${effectiveRotation} ${cx} ${cy}) translate(${x} ${y})`}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      className="cursor-pointer select-none"
    >
      {/* Outer Card Background */}
      <rect
        width={w}
        height={h}
        rx={12}
        fill={isLight ? '#ffffff' : '#0e121a'}
        stroke={isTargetCandidate ? '#38bdf8' : isSelected ? '#a855f7' : isLight ? '#e2e8f0' : '#1e293b'}
        strokeWidth={isTargetCandidate ? 2.5 : isSelected ? 2.5 : 1.5}
        filter={
          isLight
            ? 'drop-shadow(0 6px 16px rgba(0,0,0,0.06))'
            : 'drop-shadow(0 10px 22px rgba(0,0,0,0.45))'
        }
      />

      {/* Top Header Strip with Column Color */}
      <rect
        width={w}
        height={6}
        rx={3}
        fill={colColor}
        opacity={0.9}
        className="pointer-events-none"
      />

      {/* Interactive HTML Card Body via foreignObject */}
      <foreignObject
        x={0}
        y={6}
        width={w}
        height={Math.max(10, h - 6)}
        className="overflow-hidden"
      >
        <div className="w-full h-full p-3 flex flex-col justify-between font-sans text-left">
          {/* Top row: Column pill + Priority badge */}
          <div>
            <div className="flex items-center justify-between gap-1.5 mb-2">
              <span
                style={{
                  backgroundColor: `${colColor}20`,
                  borderColor: `${colColor}40`,
                  color: colColor,
                }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 truncate"
              >
                <Columns className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">{currentColumn.title}</span>
              </span>

              <span
                className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${prio.bg}`}
              >
                {prio.label}
              </span>
            </div>

            {/* Task Title with interactive checkbox */}
            <div className="flex items-start gap-2 mt-1">
              <button
                type="button"
                onClick={handleToggleDone}
                title={isDone ? 'Marcar como pendente' : 'Marcar como concluída'}
                className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                  isDone
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : isLight
                    ? 'border-slate-300 hover:border-emerald-500 bg-white'
                    : 'border-slate-600 hover:border-emerald-400 bg-slate-800'
                }`}
              >
                {isDone && <Check className="w-3 h-3 stroke-[3]" />}
              </button>

              <span
                className={`text-xs font-semibold leading-snug line-clamp-2 ${
                  isDone
                    ? 'line-through text-slate-400'
                    : isLight
                    ? 'text-slate-800'
                    : 'text-slate-100'
                }`}
              >
                {taskTitle}
              </span>
            </div>
          </div>

          {/* Bottom row: Pomodoro / Tags / Open Kanban Button */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-700/30 text-[10px]">
            <div className="flex items-center gap-2 truncate text-slate-400">
              {liveTask?.pomodorosEstimated ? (
                <span
                  title={`${liveTask.pomodorosCompleted || 0} de ${liveTask.pomodorosEstimated} pomodoros`}
                  className="flex items-center gap-1 font-mono text-amber-400 font-bold"
                >
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>
                    {liveTask.pomodorosCompleted || 0}/{liveTask.pomodorosEstimated}
                  </span>
                </span>
              ) : null}

              {liveTask?.tags && liveTask.tags.length > 0 ? (
                <span className="truncate text-slate-400">
                  #{liveTask.tags[0]}
                </span>
              ) : null}
            </div>

            <button
              type="button"
              onClick={handleOpenKanban}
              title="Abrir no Quadro Kanban"
              className={`p-1 rounded transition-colors ${
                isLight
                  ? 'hover:bg-slate-100 text-purple-600'
                  : 'hover:bg-slate-800 text-purple-400 hover:text-purple-300'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </foreignObject>

      {/* Lucidspark connection hotspots on 4 sides */}
      <NodeHotspots
        width={w}
        height={h}
        visible={isHovered || isSelected || Boolean(isConnecting)}
        isTargetCandidate={isTargetCandidate}
        activeSide={targetSide}
        onAnchorPointerDown={(e, side, pt) => {
          onAnchorPointerDown?.(e, side, { x: x + pt.x, y: y + pt.y });
        }}
      />
    </g>
  );
};
