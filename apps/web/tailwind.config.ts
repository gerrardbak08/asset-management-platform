// DESIGN.md §2 시맨틱 토큰 + §3 타이포 스케일 + §4 8px 그리드를 Tailwind 로 매핑
import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', 'system-ui', 'sans-serif'],
        mono: ['Pretendard Variable', 'Pretendard', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ── 기반 서피스 (DESIGN.md §2)
        background: 'hsl(var(--background) / <alpha-value>)',
        card: 'hsl(var(--card) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        'muted-foreground': 'hsl(var(--muted-foreground) / <alpha-value>)',
        border: 'hsl(var(--border) / <alpha-value>)',
        muted: 'hsl(var(--muted) / <alpha-value>)',

        // ── 브랜드
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },

        // ── 시맨틱 4색 (각각 DEFAULT / foreground / subtle / border)
        danger: {
          DEFAULT: 'hsl(var(--danger) / <alpha-value>)',
          foreground: 'hsl(var(--danger-foreground) / <alpha-value>)',
          subtle: 'hsl(var(--danger-subtle) / <alpha-value>)',
          border: 'hsl(var(--danger-border) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning) / <alpha-value>)',
          foreground: 'hsl(var(--warning-foreground) / <alpha-value>)',
          subtle: 'hsl(var(--warning-subtle) / <alpha-value>)',
          border: 'hsl(var(--warning-border) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'hsl(var(--info) / <alpha-value>)',
          foreground: 'hsl(var(--info-foreground) / <alpha-value>)',
          subtle: 'hsl(var(--info-subtle) / <alpha-value>)',
          border: 'hsl(var(--info-border) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'hsl(var(--success) / <alpha-value>)',
          foreground: 'hsl(var(--success-foreground) / <alpha-value>)',
          subtle: 'hsl(var(--success-subtle) / <alpha-value>)',
          border: 'hsl(var(--success-border) / <alpha-value>)',
        },

        // ── 사이드바 (라이트·다크 동일, 항상 어두운 chrome)
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar) / <alpha-value>)',
          foreground: 'hsl(var(--sidebar-foreground) / <alpha-value>)',
          'muted-foreground': 'hsl(var(--sidebar-muted-foreground) / <alpha-value>)',
          accent: 'hsl(var(--sidebar-accent) / <alpha-value>)',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground) / <alpha-value>)',
          border: 'hsl(var(--sidebar-border) / <alpha-value>)',
        },
      },
      borderRadius: {
        lg: '14px',
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        'elev-1': '0 1px 2px rgb(0 0 0 / 0.06)',
        'elev-2': '0 1px 3px rgb(0 0 0 / 0.08)',
        'elev-3': '0 2px 6px rgb(0 0 0 / 0.08)',
      },
      fontSize: {
        // ── DESIGN.md §3 UI 텍스트 스케일
        'display-lg': ['30px', { lineHeight: '1.1', fontWeight: '700' }],
        'display-md': ['22px', { lineHeight: '1.15', fontWeight: '700' }],
        'heading-lg': ['18px', { lineHeight: '1.3', fontWeight: '600' }],
        'heading-md': ['16px', { lineHeight: '1.35', fontWeight: '600' }],
        'heading-sm': ['14px', { lineHeight: '1.4', fontWeight: '600' }],
        body: ['13px', { lineHeight: '1.55', fontWeight: '400' }],
        'body-strong': ['13px', { lineHeight: '1.55', fontWeight: '600' }],
        caption: ['11px', { lineHeight: '1.4', fontWeight: '500' }],
        micro: ['10px', { lineHeight: '1.35', fontWeight: '500' }],

        // ── KPI 숫자 스케일 (DM Mono + tabular-nums 필수)
        'kpi-huge': ['40px', { lineHeight: '1.05', fontWeight: '700' }],
        'kpi-display': ['32px', { lineHeight: '1.1', fontWeight: '700' }],
        'kpi-metric': ['24px', { lineHeight: '1.15', fontWeight: '700' }],
        'kpi-inline': ['16px', { lineHeight: '1.3', fontWeight: '600' }],
      },
      letterSpacing: {
        tight: '-0.02em',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
      },
    },
  },
  plugins: [],
} satisfies Config;
