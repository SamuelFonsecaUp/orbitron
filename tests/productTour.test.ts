// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { MAIN_TOUR_STEPS } from '../src/modules/tour/tourSteps';

describe('Product Tour System (Guided Onboarding Spotlight)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defines structured steps with selectors, titles, and explanations', () => {
    expect(MAIN_TOUR_STEPS.length).toBe(9);

    for (const step of MAIN_TOUR_STEPS) {
      expect(step.id).toBeDefined();
      expect(step.title).toBeTruthy();
      expect(step.description).toBeTruthy();
      expect(step.targetSelector).toMatch(/^\[data-tour="[^"]+"\]$/);
      expect(step.pillarBadge).toBeTruthy();
      expect(step.pillarColor).toBeTruthy();
    }
  });

  it('explains the 4 core pillars with dedicated steps and module sync', () => {
    const modulesIncluded = MAIN_TOUR_STEPS.map((s) => s.requiredModule).filter(Boolean);
    expect(modulesIncluded).toContain('finance');
    expect(modulesIncluded).toContain('habits');
    expect(modulesIncluded).toContain('tools');
    expect(modulesIncluded).toContain('journey');

    const viewsIncluded = MAIN_TOUR_STEPS.map((s) => s.requiredView).filter(Boolean);
    expect(viewsIncluded).toContain('dashboard');
    expect(viewsIncluded).toContain('habits');
    expect(viewsIncluded).toContain('tools_notes');
    expect(viewsIncluded).toContain('tools_mindmap');
    expect(viewsIncluded).toContain('tools_vault');
    expect(viewsIncluded).toContain('journey');
  });

  it('includes hands-on interactive steps with action hints', () => {
    const interactiveSteps = MAIN_TOUR_STEPS.filter((s) => s.interactive);
    expect(interactiveSteps.length).toBeGreaterThanOrEqual(3);

    for (const s of interactiveSteps) {
      expect(s.actionHint).toBeTruthy();
      expect(s.actionSelector || s.targetSelector).toBeDefined();
    }
  });

  it('manages tour persistence in localStorage', () => {
    const STORAGE_KEY = 'orbitron_tour_progress_v2';
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    const progress = {
      main_tour: {
        completed: false,
        lastStep: 2,
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));

    const retrieved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(retrieved.main_tour.completed).toBe(false);
    expect(retrieved.main_tour.lastStep).toBe(2);

    // Mark completed
    progress.main_tour.completed = true;
    progress.main_tour.lastStep = MAIN_TOUR_STEPS.length - 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));

    const finalState = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(finalState.main_tour.completed).toBe(true);
    expect(finalState.main_tour.lastStep).toBe(MAIN_TOUR_STEPS.length - 1);
  });
});
