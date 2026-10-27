import { describe, it, expect, beforeEach } from 'vitest';
import { kanbanStore } from '../../src/modules/kanban/kanbanStore';

describe('Kanban Store & Tasks Engine', () => {
  it('manages columns (add, update, reorder, delete)', () => {
    const snapBefore = kanbanStore.getSnapshot();
    const initialColCount = snapBefore.columns.length;

    // Add column
    const newCol = kanbanStore.addColumn('Testes de QA', '#f43f5e');
    expect(kanbanStore.getSnapshot().columns.length).toBe(initialColCount + 1);
    expect(newCol.title).toBe('Testes de QA');

    // Update column
    kanbanStore.updateColumn(newCol.id, { title: 'Testes Automatizados', color: '#10b981' });
    const updated = kanbanStore.getSnapshot().columns.find((c) => c.id === newCol.id);
    expect(updated?.title).toBe('Testes Automatizados');
    expect(updated?.color).toBe('#10b981');

    // Reorder
    const colIds = kanbanStore.getSnapshot().columns.map((c) => c.id);
    const reversed = [...colIds].reverse();
    kanbanStore.reorderColumns(reversed);
    expect(kanbanStore.getSnapshot().columns[0].id).toBe(reversed[0]);

    // Delete column
    kanbanStore.deleteColumn(newCol.id);
    expect(kanbanStore.getSnapshot().columns.some((c) => c.id === newCol.id)).toBe(false);
  });

  it('manages tasks (add, update, subtasks, move, delete)', () => {
    const cols = kanbanStore.getSnapshot().columns;
    const targetCol = cols[0];

    // Add task
    const task = kanbanStore.addTask({
      columnId: targetCol.id,
      title: 'Tarefa de Teste',
      description: 'Descrição de teste',
      priority: 'high',
      tags: ['Testes', 'Unitários'],
      subtasks: [
        { id: 'sub-a', text: 'Etapa 1', completed: false },
        { id: 'sub-b', text: 'Etapa 2', completed: true },
      ],
      pomodorosEstimated: 4,
      pomodorosCompleted: 0,
    });

    expect(task.id).toBeDefined();
    expect(task.title).toBe('Tarefa de Teste');
    expect(kanbanStore.getSnapshot().tasks.some((t) => t.id === task.id)).toBe(true);

    // Toggle subtask
    kanbanStore.toggleSubtask(task.id, 'sub-a');
    let updatedTask = kanbanStore.getSnapshot().tasks.find((t) => t.id === task.id);
    expect(updatedTask?.subtasks.find((s) => s.id === 'sub-a')?.completed).toBe(true);

    // Increment pomodoro
    kanbanStore.incrementPomodoro(task.id);
    updatedTask = kanbanStore.getSnapshot().tasks.find((t) => t.id === task.id);
    expect(updatedTask?.pomodorosCompleted).toBe(1);

    // Move task to another column
    if (cols.length > 1) {
      const nextCol = cols[1];
      kanbanStore.moveTask(task.id, nextCol.id);
      updatedTask = kanbanStore.getSnapshot().tasks.find((t) => t.id === task.id);
      expect(updatedTask?.columnId).toBe(nextCol.id);
    }

    // Delete task
    kanbanStore.deleteTask(task.id);
    expect(kanbanStore.getSnapshot().tasks.some((t) => t.id === task.id)).toBe(false);
  });

  it('filters by priority, search query, and tag', () => {
    kanbanStore.setSearchQuery('orçamento');
    expect(kanbanStore.getSnapshot().searchQuery).toBe('orçamento');

    kanbanStore.setFilterPriority('urgent');
    expect(kanbanStore.getSnapshot().filterPriority).toBe('urgent');

    kanbanStore.setFilterTag('Finanças');
    expect(kanbanStore.getSnapshot().filterTag).toBe('Finanças');

    // Reset filters
    kanbanStore.setSearchQuery('');
    kanbanStore.setFilterPriority('all');
    kanbanStore.setFilterTag('all');
  });
});
