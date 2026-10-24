import { describe, it, expect } from 'vitest';
import {
  createMoveNodesCommand,
  createResizeNodeCommand,
  createRotateNodeCommand,
  createAddNodeCommand,
  createDeleteElementsCommand,
  createReorderNodesCommand,
  CanvasState,
} from '../../src/modules/canvas/scene/commands';
import { HistoryManager } from '../../src/modules/canvas/store/history';
import { CanvasNode } from '../../src/modules/canvas/io/jsonCanvas.types';

describe('Canvas Commands and History', () => {
  const initialNodes: CanvasNode[] = [
    { id: '1', type: 'text', x: 0, y: 0, width: 100, height: 100 },
    { id: '2', type: 'text', x: 200, y: 200, width: 100, height: 100 },
  ];

  const initialState: CanvasState = {
    nodes: initialNodes,
    edges: [],
    selection: ['1'],
  };

  it('executes and undoes MoveNodesCommand', () => {
    const cmd = createMoveNodesCommand(['1'], { dx: 50, dy: 30 });
    const executed = cmd.execute(initialState);
    expect(executed.nodes[0].x).toBe(50);
    expect(executed.nodes[0].y).toBe(30);
    expect(executed.nodes[1].x).toBe(200);

    const undone = cmd.undo(executed);
    expect(undone.nodes[0].x).toBe(0);
    expect(undone.nodes[0].y).toBe(0);
  });

  it('executes and undoes ResizeNodeCommand', () => {
    const before = { x: 0, y: 0, width: 100, height: 100 };
    const after = { x: 0, y: 0, width: 300, height: 250 };
    const cmd = createResizeNodeCommand('1', before, after);

    const executed = cmd.execute(initialState);
    expect(executed.nodes[0].width).toBe(300);
    expect(executed.nodes[0].height).toBe(250);

    const undone = cmd.undo(executed);
    expect(undone.nodes[0].width).toBe(100);
    expect(undone.nodes[0].height).toBe(100);
  });

  it('executes and undoes RotateNodeCommand', () => {
    const cmd = createRotateNodeCommand('1', 0, 45);
    const executed = cmd.execute(initialState);
    expect(executed.nodes[0].orbitron?.rotation).toBe(45);

    const undone = cmd.undo(executed);
    expect(undone.nodes[0].orbitron?.rotation).toBe(0);
  });

  it('executes and undoes AddNodeCommand and DeleteElementsCommand', () => {
    const newNode: CanvasNode = { id: '3', type: 'text', x: 50, y: 50, width: 80, height: 80 };
    const addCmd = createAddNodeCommand(newNode);

    const withAdded = addCmd.execute(initialState);
    expect(withAdded.nodes.length).toBe(3);

    const delCmd = createDeleteElementsCommand([newNode], []);
    const withDeleted = delCmd.execute(withAdded);
    expect(withDeleted.nodes.length).toBe(2);

    const restored = delCmd.undo(withDeleted);
    expect(restored.nodes.length).toBe(3);
    expect(restored.nodes.some((n) => n.id === '3')).toBe(true);
  });

  it('manages undo/redo history with HistoryManager', () => {
    const history = new HistoryManager(3);
    let state = initialState;

    const cmd1 = createMoveNodesCommand(['1'], { dx: 10, dy: 10 });
    state = cmd1.execute(state);
    history.push(cmd1);

    const cmd2 = createMoveNodesCommand(['1'], { dx: 20, dy: 20 });
    state = cmd2.execute(state);
    history.push(cmd2);

    expect(state.nodes[0].x).toBe(30);
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);

    state = history.undo(state)!;
    expect(state.nodes[0].x).toBe(10);
    expect(history.canRedo()).toBe(true);

    state = history.redo(state)!;
    expect(state.nodes[0].x).toBe(30);
  });
});
