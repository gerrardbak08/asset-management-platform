// 라이트/다크 토글 — Sun/Moon 아이콘 1개 버튼
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/theme';

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);
  const Icon = theme === 'light' ? Moon : Sun;
  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-lg p-1.5 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
      aria-label={`테마 전환 — 현재 ${theme === 'light' ? '라이트' : '다크'}`}
      title={`${theme === 'light' ? '다크' : '라이트'} 모드로 전환`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
