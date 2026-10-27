import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { FinancialProvider } from './context/FinancialContext';
import { HabitsProvider } from './context/HabitsContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/700.css';
import '@fontsource/orbitron/400.css';
import '@fontsource/orbitron/700.css';
import '@fontsource/orbitron/900.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <FinancialProvider>
        <HabitsProvider>
          <App />
        </HabitsProvider>
      </FinancialProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
