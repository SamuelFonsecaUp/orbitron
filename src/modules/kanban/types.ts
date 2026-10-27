export type KanbanPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface KanbanSubtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface KanbanTask {
  id: string;
  columnId: string;
  title: string;
  description?: string;
  priority: KanbanPriority;
  tags: string[];
  dueDate?: string; // YYYY-MM-DD
  subtasks: KanbanSubtask[];
  pomodorosEstimated: number;
  pomodorosCompleted: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  order: number;
  wipLimit?: number;
}

export interface KanbanBoardState {
  columns: KanbanColumn[];
  tasks: KanbanTask[];
  searchQuery: string;
  filterPriority: KanbanPriority | 'all';
  filterTag: string | 'all';
}
