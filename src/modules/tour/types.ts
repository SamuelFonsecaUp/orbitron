import { AppModule, AppView } from '../../context/FinancialContext';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  requiredModule?: AppModule;
  requiredView?: AppView;
  interactive?: boolean;
  actionHint?: string;
  actionSelector?: string;
}

export interface TourProgressRecord {
  completed: boolean;
  lastStep: number;
  completedAt?: string;
}

export interface TourContextValue {
  isTourActive: boolean;
  currentStepIndex: number;
  currentStep: TourStep | null;
  totalSteps: number;
  actionSuccess: boolean;
  isPaused: boolean;
  startTour: (tourId?: string, resume?: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  finishTour: () => void;
  restartTour: (tourId?: string) => void;
  notifyActionDone: () => void;
  hasCompletedTour: (tourId?: string) => boolean;
}
