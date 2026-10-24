import { Command, CanvasState } from '../scene/commands';

export class HistoryManager {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];
  private maxDepth: number;

  constructor(maxDepth = 100) {
    this.maxDepth = maxDepth;
  }

  push(command: Command) {
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  undo(state: CanvasState): CanvasState | null {
    const cmd = this.undoStack.pop();
    if (!cmd) return null;
    const nextState = cmd.undo(state);
    this.redoStack.push(cmd);
    return nextState;
  }

  redo(state: CanvasState): CanvasState | null {
    const cmd = this.redoStack.pop();
    if (!cmd) return null;
    const nextState = cmd.execute(state);
    this.undoStack.push(cmd);
    return nextState;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}
