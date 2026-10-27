import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Kanban,
  Sparkles,
  Columns,
  Layers,
  Timer,
} from 'lucide-react';
import {
  kanbanStore,
  useKanbanStore,
} from '../../modules/kanban/kanbanStore';
import { KanbanTask, KanbanPriority } from '../../modules/kanban/types';
import { KanbanColumnComponent } from './kanban/KanbanColumnComponent';
import { KanbanTaskModal } from './kanban/KanbanTaskModal';
import { useFinancial } from '../../context/FinancialContext';

export const KanbanTab: React.FC = () => {
  const { showToast, setCurrentView } = useFinancial();
  const { columns, tasks, searchQuery, filterPriority, filterTag } = useKanbanStore();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<KanbanTask | null>(null);
  const [selectedColumnForNew, setSelectedColumnForNew] = useState<string | undefined>(undefined);

  // Filter tasks according to search, priority and tag
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchTags = t.tags?.some((tag) => tag.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchTags) return false;
      }

      // Priority
      if (filterPriority !== 'all' && t.priority !== filterPriority) {
        return false;
      }

      // Tag
      if (filterTag !== 'all' && !t.tags?.includes(filterTag)) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, filterPriority, filterTag]);

  // All unique tags for the tag filter
  const allTags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.tags?.forEach((tag) => set.add(tag)));
    return Array.from(set);
  }, [tasks]);

  const handleOpenNewTask = (columnId?: string) => {
    setTaskToEdit(null);
    setSelectedColumnForNew(columnId || columns[0]?.id);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: KanbanTask) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleAddColumn = () => {
    const title = window.prompt('Nome da nova coluna do Kanban:');
    if (title && title.trim()) {
      kanbanStore.addColumn(title.trim());
      showToast(`Coluna "${title.trim()}" criada!`, 'success');
    }
  };

  const handleMoveColumn = (columnIndex: number, direction: 'left' | 'right') => {
    const newIndex = direction === 'left' ? columnIndex - 1 : columnIndex + 1;
    if (newIndex < 0 || newIndex >= columns.length) return;

    const columnIds = columns.map((c) => c.id);
    const temp = columnIds[columnIndex];
    columnIds[columnIndex] = columnIds[newIndex];
    columnIds[newIndex] = temp;

    kanbanStore.reorderColumns(columnIds);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Filter and Actions Bar */}
      <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar tarefas, etiquetas ou descrições..."
              value={searchQuery}
              onChange={(e) => kanbanStore.setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => kanbanStore.setFilterPriority(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="all">Todas Prioridades</option>
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente 🔥</option>
          </select>

          {/* Tag filter */}
          {allTags.length > 0 && (
            <select
              value={filterTag}
              onChange={(e) => kanbanStore.setFilterTag(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-500"
            >
              <option value="all">Todas Etiquetas</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  #{t}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Quick link to Pomodoro */}
          <button
            onClick={() => setCurrentView('tools_pomodoro' as any)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition shadow-sm"
            title="Abrir Relógio Pomodoro"
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Pomodoro</span>
          </button>

          {/* Add Column Button */}
          <button
            onClick={handleAddColumn}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700/60 shadow-sm"
          >
            <Columns className="w-3.5 h-3.5 text-purple-400" />
            <span>Nova Coluna</span>
          </button>

          {/* Add Task Button */}
          <button
            onClick={() => handleOpenNewTask()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Kanban Columns */}
      <div className="flex items-start gap-4 overflow-x-auto pb-6 pt-1 scrollbar-thin">
        {columns
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((col, index) => {
            const columnTasks = filteredTasks
              .filter((t) => t.columnId === col.id)
              .sort((a, b) => a.order - b.order);

            return (
              <KanbanColumnComponent
                key={col.id}
                column={col}
                tasks={columnTasks}
                allColumns={columns}
                onAddTask={(colId) => handleOpenNewTask(colId)}
                onEditTask={handleOpenEditTask}
                canMoveLeft={index > 0}
                canMoveRight={index < columns.length - 1}
                onMoveColumn={(dir) => handleMoveColumn(index, dir)}
              />
            );
          })}

        {/* Add column quick placeholder button at the end */}
        <div className="w-64 shrink-0">
          <button
            onClick={handleAddColumn}
            className="w-full h-32 rounded-3xl border-2 border-dashed border-slate-800/80 hover:border-purple-500/50 hover:bg-purple-500/5 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-purple-300 transition group"
          >
            <div className="w-9 h-9 rounded-2xl bg-slate-900 group-hover:bg-purple-500/20 border border-slate-800 group-hover:border-purple-500/40 flex items-center justify-center">
              <Plus className="w-4 h-4 text-slate-400 group-hover:text-purple-400" />
            </div>
            <span className="text-xs font-bold">Adicionar Coluna</span>
          </button>
        </div>
      </div>

      {/* Task Modal for Create / Edit */}
      <KanbanTaskModal
        isOpen={isTaskModalOpen}
        taskToEdit={taskToEdit}
        defaultColumnId={selectedColumnForNew}
        columns={columns}
        onClose={() => setIsTaskModalOpen(false)}
      />
    </div>
  );
};
