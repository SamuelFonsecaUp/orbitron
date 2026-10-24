import { useEffect } from 'react';
import { canvasStore } from '../store/canvasStore';
import {
  createDeleteElementsCommand,
  createMoveNodesCommand,
  createAddNodeCommand,
} from '../scene/commands';
import { CanvasNode } from '../io/jsonCanvas.types';

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
        selected.forEach((n) => {
          const cloned: CanvasNode = {
            ...n,
            id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            x: n.x + 30,
            y: n.y + 30,
          };
          canvasStore.dispatch(createAddNodeCommand(cloned));
        });
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
