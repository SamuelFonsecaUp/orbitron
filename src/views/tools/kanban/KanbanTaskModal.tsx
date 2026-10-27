import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Tag,
  CheckSquare,
  ListTodo,
  Check,
  Timer,
} from 'lucide-react';
import {
  KanbanTask,
  KanbanColumn,
  KanbanPriority,
  KanbanSubtask,
} from '../../../modules/kanban/types';
import { kanbanStore } from '../../../modules/kanban/kanbanStore';
import { useFinancial } from '../../../context/FinancialContext';

interface KanbanTaskModalProps {
  isOpen: boolean;
  taskToEdit: KanbanTask | null;
  defaultColumnId?: string;
  columns: KanbanColumn[];
  onClose: () => void;
}

export const KanbanTaskModal: React.FC<KanbanTaskModalProps> = ({
  isOpen,
  taskToEdit,
  defaultColumnId,
  columns,
  onClose,
}) => {
  const { showToast } = useFinancial();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState(defaultColumnId || columns[0]?.id || '');
  const [priority, setPriority] = useState<KanbanPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<KanbanSubtask[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [pomodorosEstimated, setPomodorosEstimated] = useState(2);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setColumnId(taskToEdit.columnId);
      setPriority(taskToEdit.priority);
      setDueDate(taskToEdit.dueDate || '');
      setTags(taskToEdit.tags || []);
      setSubtasks(taskToEdit.subtasks || []);
      setPomodorosEstimated(taskToEdit.pomodorosEstimated || 2);
    } else {
      setTitle('');
      setDescription('');
      setColumnId(defaultColumnId || columns[0]?.id || '');
      setPriority('medium');
      setDueDate('');
      setTags([]);
      setSubtasks([]);
      setPomodorosEstimated(2);
    }
  }, [taskToEdit, defaultColumnId, columns, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddSubtask = () => {
    const text = subtaskInput.trim();
    if (text) {
      setSubtasks([
        ...subtasks,
        { id: `sub-${Date.now()}`, text, completed: false },
      ]);
      setSubtaskInput('');
    }
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      showToast('O título da tarefa é obrigatório.', 'error');
      return;
    }

    if (taskToEdit) {
      kanbanStore.updateTask(taskToEdit.id, {
        title: cleanTitle,
        description: description.trim(),
        columnId,
        priority,
        dueDate: dueDate || undefined,
        tags,
        subtasks,
        pomodorosEstimated: Number(pomodorosEstimated) || 0,
      });
      showToast('Tarefa atualizada com sucesso!', 'success');
    } else {
      kanbanStore.addTask({
        title: cleanTitle,
        description: description.trim(),
        columnId,
        priority,
        dueDate: dueDate || undefined,
        tags,
        subtasks,
        pomodorosEstimated: Number(pomodorosEstimated) || 0,
        pomodorosCompleted: 0,
      });
      showToast('Nova tarefa criada!', 'success');
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl bg-slate-950 border border-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 font-black text-white text-base">
            <ListTodo className="w-5 h-5 text-purple-400" />
            <span>{taskToEdit ? 'Editar Tarefa' : 'Nova Tarefa no Kanban'}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Título da Tarefa *
            </label>
            <input
              type="text"
              autoFocus
              placeholder="Ex: Definir metas do trimestre..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-semibold text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Descrição detalhada (opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Adicione detalhes, links ou orientações sobre esta tarefa..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          {/* Column & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Coluna</label>
              <select
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
              >
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as KanbanPriority)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente 🔥</option>
              </select>
            </div>
          </div>

          {/* Due date & Pomodoro estimation */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <span>Data Limite (Prazo)</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1 flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-rose-400" />
                <span>Estimativa de Pomodoros (Foco)</span>
              </label>
              <input
                type="number"
                min="0"
                max="20"
                value={pomodorosEstimated}
                onChange={(e) => setPomodorosEstimated(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Tags input */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-purple-400" />
              <span>Etiquetas / Tags</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: Trabalho, Finanças, Ideias..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold"
              >
                Adicionar
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[11px] font-semibold"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-white"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Subtasks Checklist */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1 flex items-center gap-1">
              <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
              <span>Lista de Subtarefas ({subtasks.filter((s) => s.completed).length}/{subtasks.length})</span>
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Adicionar etapa ou subtarefa..."
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Inserir</span>
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-white/5"
                  >
                    <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={() => handleToggleSubtask(st.id)}
                        className="rounded accent-purple-500 w-3.5 h-3.5"
                      />
                      <span
                        className={`truncate text-xs ${
                          st.completed ? 'line-through text-slate-500' : 'text-slate-300'
                        }`}
                      >
                        {st.text}
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-white shadow-lg shadow-purple-600/30 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{taskToEdit ? 'Salvar Alterações' : 'Criar Tarefa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
