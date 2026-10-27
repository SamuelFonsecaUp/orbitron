import { useState, useEffect, useCallback } from 'react';

export function useAlwaysOnTop() {
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);

  const checkStatus = useCallback(async () => {
    if (typeof window !== 'undefined' && window.electronAPI?.isAlwaysOnTop) {
      try {
        const status = await window.electronAPI.isAlwaysOnTop();
        setIsAlwaysOnTop(Boolean(status));
      } catch (_) {}
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const handleToggleEvent = () => checkStatus();
    window.addEventListener('orbitron:always-on-top-changed', handleToggleEvent);
    return () => {
      window.removeEventListener('orbitron:always-on-top-changed', handleToggleEvent);
    };
  }, [checkStatus]);

  const toggleAlwaysOnTop = useCallback(async () => {
    if (typeof window !== 'undefined' && window.electronAPI?.toggleAlwaysOnTop) {
      try {
        const next = await window.electronAPI.toggleAlwaysOnTop();
        setIsAlwaysOnTop(Boolean(next));
        window.dispatchEvent(new CustomEvent('orbitron:always-on-top-changed', { detail: next }));
        return Boolean(next);
      } catch (err) {
        console.error('Failed to toggle always on top:', err);
      }
    }
    return false;
  }, []);

  const setAlwaysOnTop = useCallback(async (flag: boolean) => {
    if (typeof window !== 'undefined' && window.electronAPI?.setAlwaysOnTop) {
      try {
        const res = await window.electronAPI.setAlwaysOnTop(flag);
        setIsAlwaysOnTop(Boolean(res));
        window.dispatchEvent(new CustomEvent('orbitron:always-on-top-changed', { detail: res }));
        return Boolean(res);
      } catch (err) {
        console.error('Failed to set always on top:', err);
      }
    }
    return false;
  }, []);

  return { isAlwaysOnTop, toggleAlwaysOnTop, setAlwaysOnTop };
}
