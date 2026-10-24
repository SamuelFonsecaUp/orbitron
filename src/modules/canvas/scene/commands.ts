import { CanvasNode, CanvasEdge, CanvasDoc } from '../io/jsonCanvas.types';
import { Rect } from './types';

export interface CanvasState {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  selection: string[];
}

export interface Command {
  id: string;
  name: string;
  execute(state: CanvasState): CanvasState;
  undo(state: CanvasState): CanvasState;
}

export function createMoveNodesCommand(
  nodeIds: string[],
  delta: { dx: number; dy: number }
): Command {
  const idSet = new Set(nodeIds);
  const applyDelta = (state: CanvasState, dx: number, dy: number): CanvasState => ({
    ...state,
    nodes: state.nodes.map((n) =>
      idSet.has(n.id) ? { ...n, x: n.x + dx, y: n.y + dy } : n
    ),
  });

  return {
    id: `move-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: 'Move nodes',
    execute: (s) => applyDelta(s, delta.dx, delta.dy),
    undo: (s) => applyDelta(s, -delta.dx, -delta.dy),
  };
}

export function createResizeNodeCommand(
  nodeId: string,
  before: Rect,
  after: Rect
): Command {
  const applyRect = (state: CanvasState, r: Rect): CanvasState => ({
    ...state,
    nodes: state.nodes.map((n) => (n.id === nodeId ? { ...n, ...r } : n)),
  });

  return {
    id: `resize-${Date.now()}-${nodeId}`,
    name: 'Resize node',
    execute: (s) => applyRect(s, after),
    undo: (s) => applyRect(s, before),
  };
}

export function createRotateNodeCommand(
  nodeId: string,
  beforeRotation: number,
  afterRotation: number
): Command {
  const applyRot = (state: CanvasState, rot: number): CanvasState => ({
    ...state,
    nodes: state.nodes.map((n) =>
      n.id === nodeId ? { ...n, orbitron: { ...n.orbitron, rotation: rot } } : n
    ),
  });

  return {
    id: `rotate-${Date.now()}-${nodeId}`,
    name: 'Rotate node',
    execute: (s) => applyRot(s, afterRotation),
    undo: (s) => applyRot(s, beforeRotation),
  };
}

export function createAddNodeCommand(node: CanvasNode): Command {
  return {
    id: `add-node-${node.id}`,
    name: 'Add node',
    execute: (s) => ({
      ...s,
      nodes: [...s.nodes, node],
      selection: [node.id],
    }),
    undo: (s) => ({
      ...s,
      nodes: s.nodes.filter((n) => n.id !== node.id),
      selection: s.selection.filter((id) => id !== node.id),
    }),
  };
}

export function createDeleteElementsCommand(
  deletedNodes: CanvasNode[],
  deletedEdges: CanvasEdge[]
): Command {
  const nodeIds = new Set(deletedNodes.map((n) => n.id));
  const edgeIds = new Set(deletedEdges.map((e) => e.id));

  return {
    id: `delete-${Date.now()}`,
    name: 'Delete elements',
    execute: (s) => ({
      ...s,
      nodes: s.nodes.filter((n) => !nodeIds.has(n.id)),
      edges: s.edges.filter((e) => !edgeIds.has(e.id)),
      selection: [],
    }),
    undo: (s) => ({
      ...s,
      nodes: [...s.nodes, ...deletedNodes],
      edges: [...s.edges, ...deletedEdges],
      selection: deletedNodes.map((n) => n.id),
    }),
  };
}

export function createAddEdgeCommand(edge: CanvasEdge): Command {
  return {
    id: `add-edge-${edge.id}`,
    name: 'Add edge',
    execute: (s) => ({ ...s, edges: [...s.edges, edge], selection: [edge.id] }),
    undo: (s) => ({
      ...s,
      edges: s.edges.filter((e) => e.id !== edge.id),
      selection: s.selection.filter((id) => id !== edge.id),
    }),
  };
}

export function createUpdateNodeCommand(
  nodeId: string,
  before: Partial<CanvasNode>,
  after: Partial<CanvasNode>
): Command {
  return {
    id: `update-node-${Date.now()}-${nodeId}`,
    name: 'Update node',
    execute: (s) => ({
      ...s,
      nodes: s.nodes.map((n) => (n.id === nodeId ? { ...n, ...after } : n)),
    }),
    undo: (s) => ({
      ...s,
      nodes: s.nodes.map((n) => (n.id === nodeId ? { ...n, ...before } : n)),
    }),
  };
}

export function createUpdateEdgeCommand(
  edgeId: string,
  before: Partial<CanvasEdge>,
  after: Partial<CanvasEdge>
): Command {
  return {
    id: `update-edge-${Date.now()}-${edgeId}`,
    name: 'Update edge',
    execute: (s) => ({
      ...s,
      edges: s.edges.map((e) => (e.id === edgeId ? { ...e, ...after } : e)),
    }),
    undo: (s) => ({
      ...s,
      edges: s.edges.map((e) => (e.id === edgeId ? { ...e, ...before } : e)),
    }),
  };
}

export function createReorderNodesCommand(
  beforeOrder: string[],
  afterOrder: string[]
): Command {
  const reorder = (s: CanvasState, order: string[]) => {
    const map = new Map(s.nodes.map((n) => [n.id, n]));
    const reordered: CanvasNode[] = [];
    for (const id of order) {
      const node = map.get(id);
      if (node) reordered.push(node);
    }
    // append any not in order list
    for (const n of s.nodes) {
      if (!order.includes(n.id)) reordered.push(n);
    }
    return { ...s, nodes: reordered };
  };

  return {
    id: `reorder-${Date.now()}`,
    name: 'Reorder nodes',
    execute: (s) => reorder(s, afterOrder),
    undo: (s) => reorder(s, beforeOrder),
  };
}
