// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  hasCompletedMandatoryOnboarding,
  markOnboardingCompletedLocallyAndRemotely,
  MANDATORY_ONBOARDING_KEY,
} from '../src/views/OnboardingView';

describe('Onboarding and Tutorial Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    // @ts-ignore
    window.electronAPI = undefined;
  });

  it('returns true if settings.onboardingCompleted is true, even when localStorage is empty', () => {
    expect(localStorage.getItem(MANDATORY_ONBOARDING_KEY)).toBeNull();
    const result = hasCompletedMandatoryOnboarding(true);
    expect(result).toBe(true);
    // Should have auto-synchronized to localStorage
    expect(localStorage.getItem(MANDATORY_ONBOARDING_KEY)).toBe('1');
  });

  it('returns true if localStorage has MANDATORY_ONBOARDING_KEY set, even when database setting is false or undefined', () => {
    localStorage.setItem(MANDATORY_ONBOARDING_KEY, '1');
    expect(hasCompletedMandatoryOnboarding(undefined)).toBe(true);
    expect(hasCompletedMandatoryOnboarding(false)).toBe(true);
  });

  it('recognizes legacy onboarding keys and preserves completed state', () => {
    localStorage.setItem('orbit_onboarding_completed', '1');
    expect(hasCompletedMandatoryOnboarding(false)).toBe(true);

    localStorage.clear();
    localStorage.setItem('pigo_onboarding_completed', '1');
    expect(hasCompletedMandatoryOnboarding(false)).toBe(true);

    localStorage.clear();
    localStorage.setItem('orbitron_mandatory_onboarding_done', '1');
    expect(hasCompletedMandatoryOnboarding(false)).toBe(true);
  });

  it('returns false only if neither database nor localStorage indicate onboarding was completed', () => {
    expect(hasCompletedMandatoryOnboarding(false)).toBe(false);
    expect(hasCompletedMandatoryOnboarding(undefined)).toBe(false);
  });

  it('markOnboardingCompletedLocallyAndRemotely marks all flags and updates electronAPI', async () => {
    const updateSettingsMock = vi.fn().mockResolvedValue({ success: true });
    // @ts-ignore
    window.electronAPI = {
      updateSettings: updateSettingsMock,
    };

    markOnboardingCompletedLocallyAndRemotely();

    expect(localStorage.getItem(MANDATORY_ONBOARDING_KEY)).toBe('1');
    expect(localStorage.getItem('pigo_platform_tour_v1_3_seen')).toBe('1');
    expect(localStorage.getItem('orbit_onboarding_completed')).toBe('1');

    const tourProgress = JSON.parse(localStorage.getItem('orbitron_tour_progress_v2') || '{}');
    expect(tourProgress.main_tour?.completed).toBe(true);
    expect(updateSettingsMock).toHaveBeenCalledWith({ onboardingCompleted: true });
  });
});
