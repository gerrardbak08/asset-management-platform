// 모션 variants/transition 공용 상수 — 대시보드 일관된 등장/전환 모션
import type { Transition, Variants } from 'motion/react';

// 기본 ease — 시각적으로 차분한 ease-out (Material Standard 곡선과 유사)
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

// 페이지/탭 전환 — 빠르고 짧은 fade
export const fadeTransition: Transition = {
  duration: 0.18,
  ease: EASE_OUT,
};

// 카드 entrance — opacity 페이드만 (y 슬라이드 제거: 메뉴/탭 전환 시 layout jitter 유발)
export const cardItemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22, ease: EASE_OUT } },
};

// 카드 grid stagger — 자식들을 50ms 간격으로 순차 fade-in
export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 },
  },
};

// 탭 콘텐츠 fade — opacity 만 (y 슬라이드 제거)
export const tabFadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: fadeTransition },
};

// Recharts 차트 애니메이션 길이 (ms) — 일관된 곡선/막대 그리기 시간
export const CHART_ANIM_MS = 800;
