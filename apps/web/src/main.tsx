// 자산관리 플랫폼 React 진입점 — 테마 부팅 → QueryClient + BrowserRouter → App
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import App from './App';
import { queryClient } from './lib/queryClient';
import { useThemeStore } from './store/theme';

import './styles/globals.css';

// 부팅 시 localStorage 의 theme 즉시 적용 (FOUC 방지)
useThemeStore.getState().init();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root element not found');

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </MotionConfig>
    </QueryClientProvider>
  </StrictMode>,
);
