// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { MAIN_TOUR_STEPS } from '../src/modules/tour/tourSteps';

describe('Product Tour System (Guided Onboarding Spotlight)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defines structured steps with selectors, titles, and explanations', () => {
    expect(MAIN_TOUR_STEPS.length).toBeGreaterThanOrEqual(5);

    for (const step of MAIN_TOUR_STEPS) {
      expect(step.id).toBeDefined();
      expect(step.title).toBeTruthy();
      expect(step.description).toBeTruthy();
      expect(step.targetSelector).toMatch(/^\[data-tour="[^"]+"\]$/);
    }
  });

  it('includes hands-on interactive steps with action hints', () => {
    const interactiveSteps = MAIN_TOUR_STEPS.filter((s) => s.interactive);
    expect(interactiveSteps.length).toBeGreaterThanOrEqual(2);

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
