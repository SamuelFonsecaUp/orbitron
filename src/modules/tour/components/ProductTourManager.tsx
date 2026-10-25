import React, { useState, useEffect, useCallback } from 'react';
import { useProductTour } from '../TourContext';
import { TourSpotlightOverlay } from './TourSpotlightOverlay';
import { TourTooltipCard } from './TourTooltipCard';

export const ProductTourManager: React.FC = () => {
  const {
    isTourActive,
    currentStepIndex,
    currentStep,
    totalSteps,
    actionSuccess,
    nextStep,
    prevStep,
    skipTour,
    notifyActionDone,
  } = useProductTour();

  const [coords, setCoords] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    radius: number;
  } | null>(null);

  const updateCoordinates = useCallback(() => {
    if (!currentStep) {
      setCoords(null);
      return;
    }

    const element = document.querySelector(currentStep.targetSelector);
    if (!element) {
      setCoords(null);
      return;
    }

    // Scroll element into view smoothly if hidden offscreen
    element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });

    const rect = element.getBoundingClientRect();
    const PADDING = 6;

    setCoords({
      x: Math.max(0, rect.left - PADDING),
      y: Math.max(0, rect.top - PADDING),
      width: rect.width + PADDING * 2,
      height: rect.height + PADDING * 2,
      radius: 14,
    });
  }, [currentStep]);

  // Keep coordinates updated on resize, scroll, and step transitions
  useEffect(() => {
    if (!isTourActive) return;

    updateCoordinates();
    const handleScrollOrResize = () => updateCoordinates();

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    // Minor poll interval to ensure dynamic drawer/tab elements are caught
    const interval = setInterval(updateCoordinates, 250);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      clearInterval(interval);
    };
  }, [isTourActive, updateCoordinates]);

  // Interactive Action Listener: attaches to real DOM element
  useEffect(() => {
    if (!isTourActive || !currentStep?.interactive) return;

    const actionSelector = currentStep.actionSelector || currentStep.targetSelector;
    const elements = document.querySelectorAll(actionSelector);
    if (elements.length === 0) return;

    const handleAction = () => {
      notifyActionDone();
    };

    elements.forEach((el) => {
      el.addEventListener('click', handleAction, { once: true });
    });

    return () => {
      elements.forEach((el) => {
        el.removeEventListener('click', handleAction);
      });
    };
  }, [isTourActive, currentStep, notifyActionDone]);

  if (!isTourActive || !currentStep) return null;

  return (
    <>
      <TourSpotlightOverlay
        coords={coords}
        interactive={currentStep.interactive}
      />
      <TourTooltipCard
        step={currentStep}
        currentStepIndex={currentStepIndex}
        totalSteps={totalSteps}
        actionSuccess={actionSuccess}
        coords={coords}
        onNext={nextStep}
        onPrev={prevStep}
        onSkip={skipTour}
      />
    </>
  );
};
