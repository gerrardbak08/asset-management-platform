// 자산관리 도메인 임계값 — DESIGN.md 4색 매핑의 단일 진실
// 정책이 바뀌면 이 파일 한 곳만 수정한다.

// 임대율 (rate %) — V16 동등
export const LEASE_RATE = {
  /** 안정으로 분류되는 최소 임대율 */
  STABLE_MIN: 95,
  /** 주의 단계의 최소 임대율 (95 미만 ~ 이 값 이상) */
  CAUTION_MIN: 85,
} as const;

// 공실률 (vacancy %) — 이슈 패널에 노출되는 기준
export const VACANCY_RATE = {
  /** 이 값 초과면 이슈 패널에 표시 */
  ALERT_GT: 5,
} as const;

// 비품 운영 변동 (ratio, -1..1)
export const SUPPLIES_MOM = {
  /** 폐기 변동 절대값이 이 값 초과면 경영 요약에 노출 */
  DISPOSAL_NOTABLE: 0.1,
} as const;

// 위치 집중도 (loc %) — 한 위치에 재고가 너무 몰린 경우
export const LOCATION_CONCENTRATION = {
  /** 이 값 초과면 경고 배너 노출 */
  WARN_GT: 80,
} as const;

// 위험도 분류 헬퍼 — 임대율 → 4색 토큰 (DESIGN.md §12 매핑)
export type RiskLevel = 'danger' | 'warning' | 'success';

export function leaseRiskOf(rate: number): RiskLevel {
  if (rate < LEASE_RATE.CAUTION_MIN) return 'danger';
  if (rate < LEASE_RATE.STABLE_MIN) return 'warning';
  return 'success';
}
