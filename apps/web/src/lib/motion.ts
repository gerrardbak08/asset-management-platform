// 모션 variants/transition 공용 상수 — 대시보드 일관된 등장/전환 모션
import type { Transition, Variants } from 'motion/react';

// 기본 ease — 시각적으로 차분한 ease-out (Material Standard 곡선과 유사)
const EASE_OUT: Transition['ease'] = [0.22, 1, 0.36, 1];

// 페이지/탭 전환 — 빠르고 짧은 fade
export const fadeTransition: Transition = {
  duration: 0.18,
  ease: EASE_OUT,
};

// 카드 entrance — fade + 6px 위로 슬라이드
export const cardItemVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_OUT } },
};

// 카드 grid stagger — 자식들을 60ms 간격으로 순차 등장
export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

// 탭 콘텐츠 fade
export const tabFadeVariants: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: fadeTransition },
};

// Recharts 차트 애니메이션 길이 (ms) — 일관된 곡선/막대 그리기 시간
export const CHART_ANIM_MS = 800;
