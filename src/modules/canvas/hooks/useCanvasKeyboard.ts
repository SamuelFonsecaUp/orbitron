import { useEffect } from 'react';
import { canvasStore } from '../store/canvasStore';
import {
  createDeleteElementsCommand,
  createMoveNodesCommand,
  createAddNodeCommand,
  createAddEdgeCommand,
} from '../scene/commands';
import { CanvasNode, CanvasEdge } from '../io/jsonCanvas.types';

let clipboardNodes: CanvasNode[] = [];
let clipboardEdges: CanvasEdge[] = [];

export function useCanvasKeyboard() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      const snap = canvasStore.getSnapshot();

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        canvasStore.undo();
        return;
      }
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        canvasStore.redo();
        return;
      }

      // Copy (Ctrl+C)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        const selSet = new Set(snap.selection);
        clipboardNodes = snap.nodes.filter((n) => selSet.has(n.id));
        clipboardEdges = snap.edges.filter((ed) => selSet.has(ed.fromNode) && selSet.has(ed.toNode));
        return;
      }

      // Paste (Ctrl+V)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        if (clipboardNodes.length === 0) return;
        e.preventDefault();
        const idMap = new Map<string, string>();
        const newNodes: CanvasNode[] = [];
        clipboardNodes.forEach((n) => {
          const newId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          idMap.set(n.id, newId);
          const cloned: CanvasNode = { ...n, id: newId, x: n.x + 35, y: n.y + 35 };
          newNodes.push(cloned);
          canvasStore.dispatch(createAddNodeCommand(cloned));
        });
        clipboardEdges.forEach((ed) => {
          const fromId = idMap.get(ed.fromNode);
          const toId = idMap.get(ed.toNode);
          if (fromId && toId) {
            const newEdge: CanvasEdge = {
              ...ed,
              id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              fromNode: fromId,
              toNode: toId,
            };
            canvasStore.dispatch(createAddEdgeCommand(newEdge));
          }
        });
        canvasStore.setSelection(newNodes.map((n) => n.id));
        return;
      }

      // Select All
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        canvasStore.setSelection(snap.nodes.map((n) => n.id));
        return;
      }

      // Duplicate (Ctrl+D)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const selected = snap.nodes.filter((n) => snap.selection.includes(n.id));
        const newIds: string[] = [];
        selected.forEach((n) => {
          const clonedId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          newIds.push(clonedId);
          const cloned: CanvasNode = { ...n, id: clonedId, x: n.x + 30, y: n.y + 30 };
          canvasStore.dispatch(createAddNodeCommand(cloned));
        });
        if (newIds.length > 0) canvasStore.setSelection(newIds);
        return;
      }

      // Delete selected
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (snap.selection.length > 0) {
          e.preventDefault();
          const selSet = new Set(snap.selection);
          const nodesToDelete = snap.nodes.filter((n) => selSet.has(n.id));
          const edgesToDelete = snap.edges.filter(
            (ed) => selSet.has(ed.id) || selSet.has(ed.fromNode) || selSet.has(ed.toNode)
          );
          if (nodesToDelete.length > 0 || edgesToDelete.length > 0) {
            canvasStore.dispatch(createDeleteElementsCommand(nodesToDelete, edgesToDelete));
          }
        }
        return;
      }

      // Quick Tools (V, H, S, T, C, P) when not holding modifier
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const k = e.key.toLowerCase();
        if (k === 'v') { canvasStore.setActiveTool('select'); return; }
        if (k === 'h') { canvasStore.setActiveTool('hand'); return; }
        if (k === 's') { canvasStore.setActiveTool('sticky'); return; }
        if (k === 't') { canvasStore.setActiveTool('text'); return; }
        if (k === 'c') { canvasStore.setActiveTool('connector'); return; }
        if (k === 'p') { canvasStore.setActiveTool('pen'); return; }
      }

      // Toggle Dark / White theme (Shift + D)
      if (e.shiftKey && !e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        canvasStore.toggleTheme();
        return;
      }

      // Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        if (snap.selection.length > 0) canvasStore.setSelection([]);
        else canvasStore.setActiveTool('select');
        return;
      }

      // Nudge with arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (snap.selection.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          let dx = 0, dy = 0;
          if (e.key === 'ArrowUp') dy = -step;
          if (e.key === 'ArrowDown') dy = step;
          if (e.key === 'ArrowLeft') dx = -step;
          if (e.key === 'ArrowRight') dx = step;
          canvasStore.dispatch(createMoveNodesCommand(snap.selection, { dx, dy }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
