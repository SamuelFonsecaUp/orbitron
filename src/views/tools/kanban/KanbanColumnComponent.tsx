import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Palette,
} from 'lucide-react';
import { KanbanColumn, KanbanTask } from '../../../modules/kanban/types';
import { kanbanStore } from '../../../modules/kanban/kanbanStore';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnComponentProps {
  column: KanbanColumn;
  tasks: KanbanTask[];
  allColumns: KanbanColumn[];
  onAddTask: (columnId: string) => void;
  onEditTask: (task: KanbanTask) => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onMoveColumn: (direction: 'left' | 'right') => void;
}

const COLUMN_COLORS = [
  '#38bdf8', // sky
  '#3b82f6', // blue
  '#a855f7', // purple
  '#ec4899', // pink
  '#f43f5e', // rose
  '#fbbf24', // amber
  '#34d399', // emerald
  '#94a3b8', // slate
];

export const KanbanColumnComponent: React.FC<KanbanColumnComponentProps> = ({
  column,
  tasks,
  allColumns,
  onAddTask,
  onEditTask,
  canMoveLeft,
  canMoveRight,
  onMoveColumn,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(column.title);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleValue.trim()) {
      kanbanStore.updateColumn(column.id, { title: titleValue.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleColorChange = (color: string) => {
    kanbanStore.updateColumn(column.id, { color });
    setMenuOpen(false);
  };

  const handleDeleteColumn = () => {
    if (allColumns.length <= 1) return;
    if (
      window.confirm(
        `Tem certeza de que deseja excluir a coluna "${column.title}" e todas as suas tarefas?`
      )
    ) {
      kanbanStore.deleteColumn(column.id);
      setMenuOpen(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      kanbanStore.moveTask(taskId, column.id);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`w-72 sm:w-80 shrink-0 flex flex-col rounded-3xl p-3.5 transition-all duration-200 border ${
        isDragOver
          ? 'bg-purple-950/30 border-purple-500/60 ring-2 ring-purple-500/30'
          : 'bg-slate-950/70 border-slate-800/80 shadow-xl backdrop-blur-md'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 px-1 border-b border-white/5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Color dot */}
          <span
            className="w-3 h-3 rounded-full shrink-0 shadow-sm"
            style={{ backgroundColor: column.color }}
          />

          {isEditingTitle ? (
            <form onSubmit={handleTitleSubmit} className="flex-1">
              <input
                type="text"
                autoFocus
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={() => {
                  if (titleValue.trim()) {
                    kanbanStore.updateColumn(column.id, { title: titleValue.trim() });
                  }
                  setIsEditingTitle(false);
                }}
                className="w-full px-2 py-0.5 rounded-lg bg-slate-900 border border-purple-500 text-xs font-bold text-white focus:outline-none"
              />
            </form>
          ) : (
            <h3
              onClick={() => setIsEditingTitle(true)}
              className="text-xs font-black text-white truncate cursor-pointer hover:text-purple-300 transition"
              title="Clique para renomear"
            >
              {column.title}
            </h3>
          )}

          {/* Task count pill */}
          <span className="text-[10px] font-mono font-bold px-2 py-0.2 rounded-full bg-slate-900 text-slate-400 border border-slate-800 shrink-0">
            {tasks.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Add task button */}
          <button
            onClick={() => onAddTask(column.id)}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
            title="Adicionar tarefa nesta coluna"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* Column options menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
              title="Opções da coluna"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {menuOpen && (
              <div className="absolute top-8 right-0 w-48 rounded-2xl bg-slate-950 border border-slate-800 p-2 shadow-2xl z-30 space-y-1.5 text-xs backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setIsEditingTitle(true);
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 transition text-left"
                >
                  <Edit2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Renomear Coluna</span>
                </button>

                {/* Color palette */}
                <div className="p-1 pt-2 border-t border-white/10">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold block mb-1 px-1">
                    Cor da Coluna:
                  </span>
                  <div className="flex items-center gap-1.5 px-1 py-1">
                    {COLUMN_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => handleColorChange(c)}
                        style={{ backgroundColor: c }}
                        className={`w-4 h-4 rounded-full border border-white/20 transition hover:scale-125 ${
                          column.color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-black' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Move Left / Right */}
                <div className="flex gap-1 pt-1 border-t border-white/10">
                  <button
                    disabled={!canMoveLeft}
                    onClick={() => {
                      onMoveColumn('left');
                      setMenuOpen(false);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-1 rounded-md bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 text-[11px]"
                    title="Mover coluna para a esquerda"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Esquerda</span>
                  </button>
                  <button
                    disabled={!canMoveRight}
                    onClick={() => {
                      onMoveColumn('right');
                      setMenuOpen(false);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-1 rounded-md bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 text-[11px]"
                    title="Mover coluna para a direita"
                  >
                    <span>Direita</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {allColumns.length > 1 && (
                  <button
                    onClick={handleDeleteColumn}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 transition text-left border-t border-white/10 pt-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Coluna</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Cards Container */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pt-3 pr-1 min-h-[400px] max-h-[calc(100vh-270px)] scrollbar-thin">
        {tasks.length === 0 ? (
          <div className="h-36 rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-center p-4 text-slate-500">
            <span className="text-xs">Nenhuma tarefa nesta coluna</span>
            <button
              onClick={() => onAddTask(column.id)}
              className="mt-2 text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Adicionar tarefa</span>
            </button>
          </div>
        ) : (
          tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              columns={allColumns}
              onEdit={onEditTask}
            />
          ))
        )}
      </div>

      {/* Footer quick add button */}
      <button
        onClick={() => onAddTask(column.id)}
        className="w-full mt-3 py-2 px-3 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 text-xs font-semibold text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5 shadow-sm"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Nova Tarefa</span>
      </button>
    </div>
  );
};
