import { JsonCanvas, JsonCanvasNode, JsonCanvasEdge } from './jsonCanvas.types';

export function serializeJsonCanvas(doc: JsonCanvas, pretty = true): string {
  const nodes = (doc.nodes || []).map((node) => {
    const clean: JsonCanvasNode = { ...node };
    // If orbitron object is empty or undefined, remove it to keep standard JSON Canvas 1.0 clean
    if (clean.orbitron && Object.keys(clean.orbitron).length === 0) {
      delete clean.orbitron;
    }
    return clean;
  });

  const edges = (doc.edges || []).map((edge) => {
    const clean: JsonCanvasEdge = { ...edge };
    if (clean.orbitron && Object.keys(clean.orbitron).length === 0) {
      delete clean.orbitron;
    }
    return clean;
  });

  const cleanDoc: JsonCanvas = {
    ...doc,
    nodes,
    edges,
  };

  return pretty ? JSON.stringify(cleanDoc, null, 2) : JSON.stringify(cleanDoc);
}
