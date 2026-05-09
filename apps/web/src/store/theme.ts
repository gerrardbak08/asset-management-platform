// 테마 스토어 — light / dark 토글, localStorage 영속, <html class="dark"> 적용
import { create } from 'zustand';

export type Theme = 'light' | 'dark';

type ThemeState = {
  theme: Theme;
  toggle: () => void;
  init: () => void;
};

const KEY = 'theme';

function applyDom(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  toggle: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    applyDom(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* storage 차단 환경 무시 */
    }
    set({ theme: next });
  },
  init: () => {
    let saved: Theme = 'light';
    try {
      const v = localStorage.getItem(KEY);
      if (v === 'light' || v === 'dark') saved = v;
    } catch {
      /* ignore */
    }
    applyDom(saved);
    set({ theme: saved });
  },
}));
