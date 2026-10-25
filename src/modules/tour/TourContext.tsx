import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { TourStep, TourProgressRecord, TourContextValue } from './types';
import { MAIN_TOUR_STEPS } from './tourSteps';
import { useFinancial } from '../../context/FinancialContext';

const STORAGE_KEY = 'orbitron_tour_progress_v2';
const TourContext = createContext<TourContextValue | null>(null);

function loadAllProgress(): Record<string, TourProgressRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(tourId: string, record: TourProgressRecord) {
  try {
    const all = loadAllProgress();
    all[tourId] = record;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setActiveModule, setCurrentView } = useFinancial();
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [actionSuccess, setActionSuccess] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState<Record<string, TourProgressRecord>>(loadAllProgress);

  const steps = MAIN_TOUR_STEPS;
  const currentStep = isTourActive && steps[currentStepIndex] ? steps[currentStepIndex] : null;

  // Sync module/view requirement when a step requests it
  useEffect(() => {
    if (!currentStep) return;
    if (currentStep.requiredModule) {
      setActiveModule(currentStep.requiredModule);
    }
    if (currentStep.requiredView) {
      setCurrentView(currentStep.requiredView);
    }
  }, [currentStep, setActiveModule, setCurrentView]);

  const startTour = useCallback((tourId: string = 'main_tour', resume: boolean = true) => {
    const prog = loadAllProgress()[tourId];
    let startIdx = 0;
    if (resume && prog && !prog.completed && typeof prog.lastStep === 'number') {
      startIdx = Math.min(prog.lastStep, steps.length - 1);
    }
    setCurrentStepIndex(startIdx);
    setActionSuccess(false);
    setIsPaused(false);
    setIsTourActive(true);
  }, [steps.length]);

  const finishTour = useCallback(() => {
    saveProgress('main_tour', { completed: true, lastStep: steps.length - 1, completedAt: new Date().toISOString() });
    setProgress(loadAllProgress());
    setIsTourActive(false);
    setActionSuccess(false);
  }, [steps.length]);

  const skipTour = useCallback(() => {
    saveProgress('main_tour', { completed: false, lastStep: currentStepIndex });
    setProgress(loadAllProgress());
    setIsTourActive(false);
    setIsPaused(true);
  }, [currentStepIndex]);

  const nextStep = useCallback(() => {
    setActionSuccess(false);
    if (currentStepIndex >= steps.length - 1) {
      finishTour();
    } else {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      saveProgress('main_tour', { completed: false, lastStep: nextIdx });
      setProgress(loadAllProgress());
    }
  }, [currentStepIndex, steps.length, finishTour]);

  const prevStep = useCallback(() => {
    setActionSuccess(false);
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      saveProgress('main_tour', { completed: false, lastStep: prevIdx });
      setProgress(loadAllProgress());
    }
  }, [currentStepIndex]);

  const restartTour = useCallback((tourId: string = 'main_tour') => {
    saveProgress(tourId, { completed: false, lastStep: 0 });
    setProgress(loadAllProgress());
    setCurrentStepIndex(0);
    setActionSuccess(false);
    setIsPaused(false);
    setIsTourActive(true);
  }, []);

  const notifyActionDone = useCallback(() => {
    setActionSuccess(true);
    setTimeout(() => {
      nextStep();
    }, 700);
  }, [nextStep]);

  const hasCompletedTour = useCallback((tourId: string = 'main_tour') => {
    return Boolean(progress[tourId]?.completed);
  }, [progress]);

  // Listen to custom global events (e.g. from Sidebar tour button)
  useEffect(() => {
    const handleGlobalOpen = () => startTour('main_tour', false);
    window.addEventListener('pigo:open-tour', handleGlobalOpen);
    window.addEventListener('orbit:open-tour', handleGlobalOpen);

    // Auto-prompt tour on first visit if never seen before
    const hasSeen = localStorage.getItem(STORAGE_KEY);
    let timer: NodeJS.Timeout | null = null;
    if (!hasSeen) {
      timer = setTimeout(() => {
        startTour('main_tour', false);
      }, 3500);
    }

    return () => {
      window.removeEventListener('pigo:open-tour', handleGlobalOpen);
      window.removeEventListener('orbit:open-tour', handleGlobalOpen);
      if (timer) clearTimeout(timer);
    };
  }, [startTour]);

  const value = useMemo<TourContextValue>(() => ({
    isTourActive,
    currentStepIndex,
    currentStep,
    totalSteps: steps.length,
    actionSuccess,
    isPaused,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    finishTour,
    restartTour,
    notifyActionDone,
    hasCompletedTour,
  }), [
    isTourActive,
    currentStepIndex,
    currentStep,
    steps.length,
    actionSuccess,
    isPaused,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    finishTour,
    restartTour,
    notifyActionDone,
    hasCompletedTour,
  ]);

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};

export function useProductTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useProductTour must be used inside a TourProvider');
  return ctx;
}
