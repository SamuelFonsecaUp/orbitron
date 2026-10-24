import { useEffect, RefObject } from 'react';
import { canvasStore } from '../store/canvasStore';

export function useWheelZoom(containerRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const screenPoint = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      if (e.ctrlKey || e.metaKey) {
        // Zoom anchored at pointer
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        canvasStore.zoomAt(screenPoint, { width: rect.width, height: rect.height }, delta);
      } else {
        // Pan
        const dx = e.shiftKey ? -e.deltaY : -e.deltaX;
        const dy = e.shiftKey ? 0 : -e.deltaY;
        canvasStore.pan(dx, dy);
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [containerRef]);
}
