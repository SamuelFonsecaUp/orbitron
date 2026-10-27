import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useFinancial } from './context/FinancialContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/Toast';
import { PinLockModal } from './components/PinLockModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { TransactionModal } from './views/TransactionModal';
import { ImportBankModal } from './views/ImportBankModal';
import { UpdateBanner } from './components/AppUpdate';
import { PlatformTourModal, hasSeenPlatformTour } from './components/PlatformTourModal';
import { OnboardingView, hasCompletedMandatoryOnboarding } from './views/OnboardingView';
import { GameCelebration } from './components/GameWidgets';
import { OrbitBootActivation } from './components/OrbitBootActivation';
import { TourProvider } from './modules/tour/TourContext';
import { ProductTourManager } from './modules/tour/components/ProductTourManager';
import { CommandPalette } from './components/CommandPalette';
import { IdleTimeDialog } from './components/IdleTimeDialog';
import { useMiniMode } from './hooks/useMiniMode';
import { MiniPlayerWidget } from './components/MiniPlayerWidget';

// Code-Splitting: Lazy load all main views on-demand to optimize bundle size and startup time
const DashboardView = lazy(() => import('./views/DashboardView').then((m) => ({ default: m.DashboardView })));
const TransactionsView = lazy(() => import('./views/TransactionsView').then((m) => ({ default: m.TransactionsView })));
const AccountsView = lazy(() => import('./views/AccountsView').then((m) => ({ default: m.AccountsView })));
const CardsView = lazy(() => import('./views/CardsView').then((m) => ({ default: m.CardsView })));
const BudgetsView = lazy(() => import('./views/BudgetsView').then((m) => ({ default: m.BudgetsView })));
const CalendarView = lazy(() => import('./views/CalendarView').then((m) => ({ default: m.CalendarView })));
const CategoriesView = lazy(() => import('./views/CategoriesView').then((m) => ({ default: m.CategoriesView })));
const GoalsView = lazy(() => import('./views/GoalsView').then((m) => ({ default: m.GoalsView })));
const ReportsView = lazy(() => import('./views/ReportsView').then((m) => ({ default: m.ReportsView })));
const SettingsView = lazy(() => import('./views/SettingsView').then((m) => ({ default: m.SettingsView })));
const ImportView = lazy(() => import('./views/ImportView').then((m) => ({ default: m.ImportView })));
const ReserveView = lazy(() => import('./views/ReserveView').then((m) => ({ default: m.ReserveView })));
const JourneyView = lazy(() => import('./views/JourneyView').then((m) => ({ default: m.JourneyView })));
const HabitsView = lazy(() => import('./views/HabitsView').then((m) => ({ default: m.HabitsView })));
const IntelligenceView = lazy(() => import('./views/IntelligenceView').then((m) => ({ default: m.IntelligenceView })));
const ToolsView = lazy(() => import('./views/ToolsView').then((m) => ({ default: m.ToolsView })));

const ViewLoadingFallback: React.FC = () => (
  <div className="flex h-full w-full items-center justify-center bg-slate-950/40">
    <div className="flex flex-col items-center gap-2.5">
      <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-[11px] text-slate-400 font-medium">Sincronizando ambiente...</span>
    </div>
  </div>
);

export const App: React.FC = () => {
  const {
    currentView,
    activeModule,
    settings,
    isLocked,
    isLoading,
    importModalOpen,
    setImportModalOpen,
  } = useFinancial();

  const [tourOpen, setTourOpen] = useState(false);
  const [setupWizardOpen, setSetupWizardOpen] = useState(false);
  const [bootCompleted, setBootCompleted] = useState(() => {
    try {
      return Boolean(sessionStorage.getItem('orbit_boot_seen'));
    } catch {
      return false;
    }
  });
  const [mandatoryDone, setMandatoryDone] = useState(() =>
    hasCompletedMandatoryOnboarding(settings?.onboardingCompleted)
  );
  const { isMiniMode, setMiniMode } = useMiniMode();

  useEffect(() => {
    setMandatoryDone(hasCompletedMandatoryOnboarding(settings?.onboardingCompleted));
  }, [settings?.onboardingCompleted]);

  useEffect(() => {
    const handleTour = () => setTourOpen(true);
    const handleWizard = () => setSetupWizardOpen(true);
    window.addEventListener('orbitron:open-tour', handleTour);
    window.addEventListener('orbitron:open-setup-wizard', handleWizard);
    window.addEventListener('pigo:open-tour', handleTour);
    window.addEventListener('pigo:open-setup-wizard', handleWizard);
    return () => {
      window.removeEventListener('orbitron:open-tour', handleTour);
      window.removeEventListener('orbitron:open-setup-wizard', handleWizard);
      window.removeEventListener('pigo:open-tour', handleTour);
      window.removeEventListener('pigo:open-setup-wizard', handleWizard);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0c0c0e] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Carregando Orbitron...</span>
        </div>
      </div>
    );
  }

  // Mandatory 5-step Tutorial & Setup gate (locks entire app until finished)
  if ((settings && !mandatoryDone) || setupWizardOpen) {
    return (
      <>
        <ToastContainer />
        <OnboardingView
          onComplete={() => {
            setMandatoryDone(true);
            setSetupWizardOpen(false);
          }}
        />
      </>
    );
  }

  // Floating Mini-Player Mode (Always-on-top compact widget for focus timer)
  if (isMiniMode && !isLocked) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-transparent select-none">
        <MiniPlayerWidget onExpand={() => setMiniMode(false)} />
      </div>
    );
  }

  // Ambient glow color based on active module
  const isAppReady = !isLoading && bootCompleted && !isLocked && mandatoryDone && !setupWizardOpen;

  const ambientGlowClass =
    activeModule === 'habits'
      ? 'from-cyan-500/[0.07] via-sky-500/[0.02] to-transparent'
      : activeModule === 'journey'
      ? 'from-amber-500/[0.08] via-orange-500/[0.02] to-transparent'
      : activeModule === 'tools'
      ? 'from-fuchsia-500/[0.08] via-purple-500/[0.02] to-transparent'
      : 'from-brand-500/[0.06] via-emerald-500/[0.02] to-transparent';

  return (
    <TourProvider isAppReady={isAppReady}>
      <div className="flex h-screen w-screen overflow-hidden bg-[#0c0c0e] text-slate-100 font-sans">
        {/* Product Tour Interactive Spotlight Overlay */}
        <ProductTourManager />

        {/* Orbit Space Boot Sequence */}
        <OrbitBootActivation onComplete={() => setBootCompleted(true)} />

        {/* PIN Security Modal */}
        {isLocked && <PinLockModal />}

        {/* Interactive Platform Onboarding Tour */}
        <PlatformTourModal isOpen={tourOpen} onClose={() => setTourOpen(false)} />

        {/* Level-up / achievement celebrations */}
        <GameCelebration />

        {/* Floating Notifications */}
        <ToastContainer />

        {/* Smart Notifications Drawer */}
        <NotificationDrawer />

        {/* Local-First Time Tracker Idle Dialog */}
        <IdleTimeDialog />

        {/* Global Command Palette (Ctrl+K) */}
        <CommandPalette />

        {/* Global Transaction Modal */}
        <TransactionModal />

        {/* Banking OFX / CSV Import Modal */}
        <ImportBankModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
        />

        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden bg-slate-950/40 relative">
          {/* Contextual Ambient Top Glow */}
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b ${ambientGlowClass} transition-colors duration-700`}
          />

          <Navbar />
          <UpdateBanner />

          <main className="flex-1 min-h-0 overflow-hidden relative z-10">
            <Suspense fallback={<ViewLoadingFallback />}>
              <div key={currentView} className="h-full w-full animate-fade-in">
                {currentView === 'dashboard' && <DashboardView />}
                {currentView === 'transactions' && <TransactionsView />}
                {currentView === 'accounts' && <AccountsView />}
                {currentView === 'cards' && <CardsView />}
                {currentView === 'budgets' && <BudgetsView />}
                {currentView === 'calendar' && <CalendarView />}
                {currentView === 'categories' && <CategoriesView />}
                {currentView === 'goals' && <GoalsView />}
                {currentView === 'reports' && <ReportsView />}
                {currentView === 'settings' && <SettingsView />}
                {currentView === 'import' && <ImportView />}
                {currentView === 'reserve' && <ReserveView />}
                {currentView.startsWith('journey') && <JourneyView />}
                {currentView.startsWith('habits') && <HabitsView />}
                {currentView === 'intelligence' && <IntelligenceView />}
                {currentView.startsWith('tools') && <ToolsView />}
              </div>
            </Suspense>
          </main>
        </div>
      </div>
    </TourProvider>
  );
};

export default App;
