import { JsonCanvas, JsonCanvasNode, JsonCanvasEdge } from './jsonCanvas.types';

export function parseJsonCanvas(raw: string | object): JsonCanvas {
  if (!raw) return { nodes: [], edges: [] };

  let data: any;
  if (typeof raw === 'string') {
    if (!raw.trim()) return { nodes: [], edges: [] };
    try {
      data = JSON.parse(raw);
    } catch {
      return { nodes: [], edges: [] };
    }
  } else {
    data = raw;
  }

  if (typeof data !== 'object' || data === null) {
    return { nodes: [], edges: [] };
  }

  const rawNodes = Array.isArray(data.nodes) ? data.nodes : [];
  const rawEdges = Array.isArray(data.edges) ? data.edges : [];

  const nodes: JsonCanvasNode[] = rawNodes.map((n: any, idx: number) => {
    const id = typeof n.id === 'string' && n.id.trim() ? n.id : `node_${idx}_${Date.now()}`;
    const type = ['text', 'file', 'link', 'group'].includes(n.type) ? n.type : 'text';
    const x = typeof n.x === 'number' ? n.x : 0;
    const y = typeof n.y === 'number' ? n.y : 0;
    const width = typeof n.width === 'number' ? n.width : 260;
    const height = typeof n.height === 'number' ? n.height : 140;

    const node: JsonCanvasNode = { ...n, id, type, x, y, width, height };
    return node;
  });

  const edges: JsonCanvasEdge[] = rawEdges.map((e: any, idx: number) => {
    const id = typeof e.id === 'string' && e.id.trim() ? e.id : `edge_${idx}_${Date.now()}`;
    const fromNode = typeof e.fromNode === 'string' ? e.fromNode : '';
    const toNode = typeof e.toNode === 'string' ? e.toNode : '';
    const edge: JsonCanvasEdge = { ...e, id, fromNode, toNode };
    return edge;
  });

  // Preserve any extra root-level properties for full round-trip fidelity
  return {
    ...data,
    nodes,
    edges,
  };
}
