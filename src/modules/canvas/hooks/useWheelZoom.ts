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

      if (e.shiftKey) {
        // Shift + Wheel = Horizontal pan
        canvasStore.pan(-e.deltaY, 0);
      } else if (e.ctrlKey || e.metaKey || e.deltaMode !== 0 || Math.abs(e.deltaY) >= 40) {
        // Direct mouse wheel zoom anchored at cursor
        const delta = e.deltaY > 0 ? 0.92 : 1.08;
        canvasStore.zoomAt(screenPoint, { width: rect.width, height: rect.height }, delta);
      } else {
        // Trackpad 2-finger pan
        canvasStore.pan(-e.deltaX, -e.deltaY);
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [containerRef]);
}
