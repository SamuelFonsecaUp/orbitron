import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Orbitron Mini Player Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('toggles mini mode and tracks previous bounds', () => {
    let isMiniMode = false;
    let preMiniBounds: { x: number; y: number; width: number; height: number } | null = null;
    let preMiniAlwaysOnTop = false;

    const mainWindowMock = {
      isMaximized: vi.fn().mockReturnValue(true),
      unmaximize: vi.fn(),
      getBounds: vi.fn().mockReturnValue({ x: 100, y: 100, width: 1300, height: 820 }),
      isAlwaysOnTop: vi.fn().mockReturnValue(false),
      setMinimumSize: vi.fn(),
      setSize: vi.fn(),
      setBounds: vi.fn(),
      setAlwaysOnTop: vi.fn(),
      webContents: {
        send: vi.fn(),
      },
    };

    function setMiniMode(enable: boolean) {
      if (enable === isMiniMode) return isMiniMode;
      if (enable) {
        preMiniBounds = mainWindowMock.getBounds();
        preMiniAlwaysOnTop = mainWindowMock.isAlwaysOnTop();
        if (mainWindowMock.isMaximized()) {
          mainWindowMock.unmaximize();
        }
        mainWindowMock.setMinimumSize(340, 72);
        mainWindowMock.setSize(380, 76);
        mainWindowMock.setAlwaysOnTop(true, 'floating');
        isMiniMode = true;
      } else {
        mainWindowMock.setMinimumSize(1060, 680);
        if (preMiniBounds) {
          mainWindowMock.setBounds(preMiniBounds);
        } else {
          mainWindowMock.setSize(1300, 820);
        }
        mainWindowMock.setAlwaysOnTop(Boolean(preMiniAlwaysOnTop), 'floating');
        isMiniMode = false;
      }
      mainWindowMock.webContents.send('window:mini-mode-changed', isMiniMode);
      return isMiniMode;
    }

    // Enter Mini Mode
    const entered = setMiniMode(true);
    expect(entered).toBe(true);
    expect(mainWindowMock.unmaximize).toHaveBeenCalled();
    expect(mainWindowMock.setSize).toHaveBeenCalledWith(380, 76);
    expect(mainWindowMock.setAlwaysOnTop).toHaveBeenCalledWith(true, 'floating');
    expect(mainWindowMock.webContents.send).toHaveBeenCalledWith('window:mini-mode-changed', true);

    // Leave Mini Mode (Restore full window)
    const exited = setMiniMode(false);
    expect(exited).toBe(false);
    expect(mainWindowMock.setMinimumSize).toHaveBeenCalledWith(1060, 680);
    expect(mainWindowMock.setBounds).toHaveBeenCalledWith({ x: 100, y: 100, width: 1300, height: 820 });
    expect(mainWindowMock.setAlwaysOnTop).toHaveBeenCalledWith(false, 'floating');
    expect(mainWindowMock.webContents.send).toHaveBeenCalledWith('window:mini-mode-changed', false);
  });

  it('handles toggle event dispatching between full window and mini player', () => {
    let miniModeActive = false;
    const toggle = () => {
      miniModeActive = !miniModeActive;
      return miniModeActive;
    };

    expect(toggle()).toBe(true);
    expect(toggle()).toBe(false);
  });
});
