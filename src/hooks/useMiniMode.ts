import { useState, useEffect, useCallback } from 'react';

export function useMiniMode() {
  const [isMiniMode, setIsMiniMode] = useState<boolean>(false);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    // Check initial state from Electron main process
    if (window.electronAPI?.isMiniMode) {
      window.electronAPI.isMiniMode().then((res) => {
        setIsMiniMode(Boolean(res));
      }).catch(() => {});
    }

    // Subscribe to IPC mini-mode change events
    if (window.electronAPI?.onMiniModeChanged) {
      cleanup = window.electronAPI.onMiniModeChanged((mini) => {
        setIsMiniMode(Boolean(mini));
      });
    }

    // Custom browser/app event listener
    const handleCustomToggle = () => {
      toggleMiniMode();
    };
    window.addEventListener('orbitron:toggle-mini-mode', handleCustomToggle);

    // Global keyboard shortcut: Ctrl+Shift+M
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleMiniMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (cleanup) cleanup();
      window.removeEventListener('orbitron:toggle-mini-mode', handleCustomToggle);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleMiniMode = useCallback(async () => {
    try {
      if (window.electronAPI?.toggleMiniMode) {
        const next = await window.electronAPI.toggleMiniMode();
        setIsMiniMode(Boolean(next));
      } else {
        // Fallback for browser testing
        setIsMiniMode((prev) => !prev);
      }
    } catch (err) {
      console.warn('[useMiniMode] Erro ao alternar modo mini player:', err);
    }
  }, []);

  const setMiniMode = useCallback(async (enable: boolean) => {
    try {
      if (window.electronAPI?.setMiniMode) {
        const next = await window.electronAPI.setMiniMode(enable);
        setIsMiniMode(Boolean(next));
      } else {
        setIsMiniMode(enable);
      }
    } catch (err) {
      console.warn('[useMiniMode] Erro ao definir modo mini player:', err);
    }
  }, []);

  return {
    isMiniMode,
    toggleMiniMode,
    setMiniMode,
  };
}
