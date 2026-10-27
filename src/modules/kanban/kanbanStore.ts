import { useSyncExternalStore } from 'react';
import { KanbanColumn, KanbanTask, KanbanBoardState, KanbanPriority } from './types';

const STORAGE_KEY = 'orbitron_kanban_board';

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: 'col-todo', title: 'A Fazer', color: '#38bdf8', order: 0 },
  { id: 'col-progress', title: 'Em Progresso', color: '#fbbf24', order: 1 },
  { id: 'col-review', title: 'Revisão', color: '#c084fc', order: 2 },
  { id: 'col-done', title: 'Concluído', color: '#34d399', order: 3 },
];

const STARTER_TASKS: KanbanTask[] = [
  {
    id: 'task-1',
    columnId: 'col-progress',
    title: 'Planejar orçamento e metas do mês',
    description: 'Revisar categorias de teto de gastos e planejar aportes na reserva.',
    priority: 'high',
    tags: ['Finanças', 'Planejamento'],
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    subtasks: [
      { id: 'sub-1', text: 'Conferir extratos bancários', completed: true },
      { id: 'sub-2', text: 'Ajustar limite das categorias', completed: false },
    ],
    pomodorosEstimated: 3,
    pomodorosCompleted: 1,
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    columnId: 'col-todo',
    title: 'Mapear ideias no Quadro Branco',
    description: 'Criar conexões visuais e notas adesivas para o próximo projeto.',
    priority: 'medium',
    tags: ['Segundo Cérebro'],
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10),
    subtasks: [
      { id: 'sub-3', text: 'Inserir referências e links', completed: false },
    ],
    pomodorosEstimated: 2,
    pomodorosCompleted: 0,
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    columnId: 'col-done',
    title: 'Configurar cofre de senhas blindado',
    description: 'Definir PIN de segurança AES-256 e salvar credenciais bancárias.',
    priority: 'urgent',
    tags: ['Segurança'],
    subtasks: [
      { id: 'sub-4', text: 'Criar PIN mestre', completed: true },
      { id: 'sub-5', text: 'Cadastrar senhas essenciais', completed: true },
    ],
    pomodorosEstimated: 1,
    pomodorosCompleted: 1,
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class KanbanStore {
  private columns: KanbanColumn[] = DEFAULT_COLUMNS;
  private tasks: KanbanTask[] = STARTER_TASKS;
  private searchQuery: string = '';
  private filterPriority: KanbanPriority | 'all' = 'all';
  private filterTag: string | 'all' = 'all';

  private listeners = new Set<() => void>();
  private snapshotCache: KanbanBoardState | null = null;

  constructor() {
    this.loadState();

    // Listen to Pomodoro completion events to auto-increment task pomodoros!
    if (typeof window !== 'undefined') {
      window.addEventListener('orbitron:pomodoro-complete', (e: any) => {
        const { mode, linkedTaskId, skipped } = e.detail || {};
        if (mode === 'focus' && !skipped && linkedTaskId) {
          this.incrementPomodoro(linkedTaskId);
        }
      });
    }
  }

  private emit() {
    this.snapshotCache = null;
    this.saveState();
    this.listeners.forEach((l) => l());
  }

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public getSnapshot = (): KanbanBoardState => {
    if (!this.snapshotCache) {
      this.snapshotCache = {
        columns: this.columns,
        tasks: this.tasks,
        searchQuery: this.searchQuery,
        filterPriority: this.filterPriority,
        filterTag: this.filterTag,
      };
    }
    return this.snapshotCache;
  };

  private loadState() {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.columns) && parsed.columns.length > 0) {
          this.columns = parsed.columns;
        }
        if (Array.isArray(parsed.tasks)) {
          this.tasks = parsed.tasks;
        }
      }
    } catch (err) {
      console.warn('[KanbanStore] Failed to load local state:', err);
    }
  }

  private saveState() {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
      const payload = {
        columns: this.columns,
        tasks: this.tasks,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {}
  }

  public setSearchQuery(q: string) {
    this.searchQuery = q;
    this.emit();
  }

  public setFilterPriority(p: KanbanPriority | 'all') {
    this.filterPriority = p;
    this.emit();
  }

  public setFilterTag(tag: string | 'all') {
    this.filterTag = tag;
    this.emit();
  }

  // Column operations
  public addColumn(title: string, color = '#a855f7') {
    const id = `col-${Date.now()}`;
    const newCol: KanbanColumn = {
      id,
      title: title.trim(),
      color,
      order: this.columns.length,
    };
    this.columns = [...this.columns, newCol];
    this.emit();
    return newCol;
  }

  public updateColumn(columnId: string, patch: Partial<KanbanColumn>) {
    this.columns = this.columns.map((col) =>
      col.id === columnId ? { ...col, ...patch } : col
    );
    this.emit();
  }

  public deleteColumn(columnId: string) {
    if (this.columns.length <= 1) return; // Keep at least one column
    // Delete column and all its tasks (or reassign)
    this.columns = this.columns.filter((c) => c.id !== columnId);
    this.tasks = this.tasks.filter((t) => t.columnId !== columnId);
    this.emit();
  }

  public reorderColumns(columnIds: string[]) {
    const map = new Map(this.columns.map((c) => [c.id, c]));
    this.columns = columnIds
      .map((id, index) => {
        const col = map.get(id);
        return col ? { ...col, order: index } : null;
      })
      .filter(Boolean) as KanbanColumn[];
    this.emit();
  }

  // Task operations
  public addTask(taskData: Omit<KanbanTask, 'id' | 'createdAt' | 'updatedAt' | 'order'>) {
    const columnTasks = this.tasks.filter((t) => t.columnId === taskData.columnId);
    const newTask: KanbanTask = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      order: columnTasks.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.tasks = [...this.tasks, newTask];
    this.emit();
    return newTask;
  }

  public updateTask(taskId: string, patch: Partial<KanbanTask>) {
    this.tasks = this.tasks.map((t) =>
      t.id === taskId
        ? { ...t, ...patch, updatedAt: new Date().toISOString() }
        : t
    );
    this.emit();
  }

  public deleteTask(taskId: string) {
    this.tasks = this.tasks.filter((t) => t.id !== taskId);
    this.emit();
  }

  public moveTask(taskId: string, targetColumnId: string, newIndex?: number) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const remaining = this.tasks.filter((t) => t.id !== taskId);
    const targetColTasks = remaining.filter((t) => t.columnId === targetColumnId);

    const updatedTask: KanbanTask = {
      ...task,
      columnId: targetColumnId,
      updatedAt: new Date().toISOString(),
    };

    if (newIndex !== undefined && newIndex >= 0 && newIndex <= targetColTasks.length) {
      targetColTasks.splice(newIndex, 0, updatedTask);
    } else {
      targetColTasks.push(updatedTask);
    }

    // Reorder target column
    targetColTasks.forEach((t, i) => {
      t.order = i;
    });

    const otherTasks = remaining.filter((t) => t.columnId !== targetColumnId);
    this.tasks = [...otherTasks, ...targetColTasks];
    this.emit();
  }

  public toggleSubtask(taskId: string, subtaskId: string) {
    this.tasks = this.tasks.map((t) => {
      if (t.id !== taskId) return t;
      const updatedSubtasks = t.subtasks.map((s) =>
        s.id === subtaskId ? { ...s, completed: !s.completed } : s
      );
      return {
        ...t,
        subtasks: updatedSubtasks,
        updatedAt: new Date().toISOString(),
      };
    });
    this.emit();
  }

  public incrementPomodoro(taskId: string) {
    this.tasks = this.tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            pomodorosCompleted: (t.pomodorosCompleted || 0) + 1,
            updatedAt: new Date().toISOString(),
          }
        : t
    );
    this.emit();
  }
}

export const kanbanStore = new KanbanStore();

export function useKanbanStore(): KanbanBoardState;
export function useKanbanStore<T>(selector: (state: KanbanBoardState) => T): T;
export function useKanbanStore<T>(selector?: (state: KanbanBoardState) => T): T | KanbanBoardState {
  return useSyncExternalStore(
    kanbanStore.subscribe,
    () => {
      const snap = kanbanStore.getSnapshot();
      return selector ? selector(snap) : snap;
    }
  );
}
