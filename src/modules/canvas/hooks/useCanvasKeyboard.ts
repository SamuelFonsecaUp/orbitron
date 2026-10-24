import { useEffect } from 'react';
import { canvasStore } from '../store/canvasStore';
import { createDeleteElementsCommand, createMoveNodesCommand } from '../scene/commands';

export function useCanvasKeyboard() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is editing inside an input, textarea or contenteditable
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

      // Escape: clear selection or switch back to select tool
      if (e.key === 'Escape') {
        e.preventDefault();
        if (snap.selection.length > 0) {
          canvasStore.clearSelection?.() || canvasStore.setSelection([]);
        } else {
          canvasStore.setActiveTool('select');
        }
        return;
      }

      // Nudge with arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (snap.selection.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          let dx = 0;
          let dy = 0;
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
