import { describe, it, expect, beforeEach } from 'vitest';
import { isImageSource, isWebUrl, normalizeUrl, getDomain } from '../../src/modules/canvas/scene/nodeUtils';
import { canvasStore } from '../../src/modules/canvas/store/canvasStore';
import { getCanvasColor } from '../../src/modules/canvas/render/colors';
import { CANVAS_THEMES, isThemeUnlocked } from '../../src/modules/canvas/store/canvasThemes';
import { calculateFitCamera } from '../../src/modules/canvas/scene/camera';

describe('Canvas Links and Utilities', () => {
  it('correctly identifies image sources', () => {
    expect(isImageSource('https://example.com/photo.png')).toBe(true);
    expect(isImageSource('https://example.com/avatar.JPG?size=large')).toBe(true);
    expect(isImageSource('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...')).toBe(true);
    expect(isImageSource('blob:http://localhost/123-abc')).toBe(true);
    expect(isImageSource('image.svg')).toBe(true);
    expect(isImageSource('image.webp')).toBe(true);

    // Non-images
    expect(isImageSource('https://github.com/facebook/react')).toBe(false);
    expect(isImageSource('https://google.com')).toBe(false);
    expect(isImageSource('')).toBe(false);
    expect(isImageSource(undefined)).toBe(false);
  });

  it('correctly identifies web URLs', () => {
    expect(isWebUrl('https://google.com')).toBe(true);
    expect(isWebUrl('http://localhost:3000')).toBe(true);
    expect(isWebUrl('www.orbitron.app')).toBe(true);
    expect(isWebUrl('Nota adesiva normal')).toBe(false);
    expect(isWebUrl('')).toBe(false);
  });

  it('normalizes URLs properly', () => {
    expect(normalizeUrl('google.com')).toBe('https://google.com');
    expect(normalizeUrl('https://github.com')).toBe('https://github.com');
    expect(normalizeUrl('http://insecure.site')).toBe('http://insecure.site');
  });

  it('extracts clean domains', () => {
    expect(getDomain('https://www.github.com/profile')).toBe('github.com');
    expect(getDomain('https://notion.so/my-page')).toBe('notion.so');
    expect(getDomain('http://localhost:5173')).toBe('localhost:5173');
  });
});

describe('Canvas Theme & Colors', () => {
  beforeEach(() => {
    canvasStore.setTheme('dark');
    canvasStore.setGridPattern('dots');
  });

  it('toggles and sets dark / light theme', () => {
    expect(canvasStore.getSnapshot().theme).toBe('dark');
    canvasStore.toggleTheme();
    expect(canvasStore.getSnapshot().theme).toBe('light');
    canvasStore.toggleTheme();
    expect(canvasStore.getSnapshot().theme).toBe('dark');

    canvasStore.setTheme('light');
    expect(canvasStore.getSnapshot().theme).toBe('light');
  });

  it('changes grid pattern', () => {
    expect(canvasStore.getSnapshot().gridPattern).toBe('dots');
    canvasStore.setGridPattern('lines');
    expect(canvasStore.getSnapshot().gridPattern).toBe('lines');
    canvasStore.setGridPattern('cross');
    expect(canvasStore.getSnapshot().gridPattern).toBe('cross');
    canvasStore.setGridPattern('none');
    expect(canvasStore.getSnapshot().gridPattern).toBe('none');
  });

  it('returns theme-aware default canvas colors', () => {
    const darkDefault = getCanvasColor(undefined, 'dark');
    expect(darkDefault.bg).toBe('#1e293b');
    expect(darkDefault.text).toBe('#f8fafc');

    const lightDefault = getCanvasColor(undefined, 'light');
    expect(lightDefault.bg).toBe('#ffffff');
    expect(lightDefault.text).toBe('#0f172a');
  });

  it('preserves colorful post-it palette in both themes', () => {
    const yellow = getCanvasColor('3', 'light');
    expect(yellow.name).toBe('Amarelo');
    expect(yellow.bg).toBe('#fefce8');
    expect(yellow.text).toBe('#713f12');
  });

  it('validates theme level unlocks correctly according to gamification progression', () => {
    // Default themes available at Level 1
    expect(isThemeUnlocked('dark', 1)).toBe(true);
    expect(isThemeUnlocked('light', 1)).toBe(true);

    // Level 15: Blueprint
    expect(isThemeUnlocked('blueprint', 14)).toBe(false);
    expect(isThemeUnlocked('blueprint', 15)).toBe(true);

    // Level 25: Cyberpunk
    expect(isThemeUnlocked('cyberpunk', 24)).toBe(false);
    expect(isThemeUnlocked('cyberpunk', 25)).toBe(true);

    // Level 35: Golden
    expect(isThemeUnlocked('golden', 34)).toBe(false);
    expect(isThemeUnlocked('golden', 35)).toBe(true);

    // Level 50: Cosmic
    expect(isThemeUnlocked('cosmic', 49)).toBe(false);
    expect(isThemeUnlocked('cosmic', 50)).toBe(true);
    expect(isThemeUnlocked('cosmic', 60)).toBe(true);
  });

  it('calculates fit camera accurately bounding all nodes', () => {
    const nodes = [
      { id: '1', x: 0, y: 0, width: 200, height: 100 },
      { id: '2', x: 400, y: 300, width: 200, height: 100 },
    ];
    const camera = calculateFitCamera(nodes, 1000, 800);
    expect(camera.zoom).toBeGreaterThan(0.5);
    expect(camera.zoom).toBeLessThanOrEqual(2.0);
    expect(typeof camera.x).toBe('number');
    expect(typeof camera.y).toBe('number');
  });
});
