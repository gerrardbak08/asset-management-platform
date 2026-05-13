// 숫자 포맷터 — V16 의 fmtKR / fmtKRfull 동등 보존
export function fmtKR(n: number): string {
  if (!n || n === 0) return '-';
  if (n >= 1e12) return (n / 1e12).toFixed(2) + '조';
  if (n >= 1e8) return Math.round(n / 1e8).toLocaleString('ko-KR') + '억';
  if (n >= 1e4) return Math.round(n / 1e4).toLocaleString('ko-KR') + '만';
  return n.toLocaleString('ko-KR');
}

export function fmtKRfull(n: number): string {
  if (!n || n === 0) return '-';
  if (n >= 1e12) return (n / 1e12).toFixed(2) + '조원';
  if (n >= 1e8) return (n / 1e8).toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '억원';
  if (n >= 1e4) return Math.round(n / 1e4).toLocaleString('ko-KR') + '만원';
  return n.toLocaleString('ko-KR') + '원';
}

// 취득가 전용 — 단위 축약 시 항상 소수점 1자리. 사용자 요청 (2026-05-10).
// 입력 단위는 '원' (raw).
export function fmtKRprice(n: number): string {
  if (!n || n === 0) return '-';
  if (n >= 1e12) return (n / 1e12).toFixed(1) + '조';
  if (n >= 1e8) return (n / 1e8).toFixed(1) + '억';
  if (n >= 1e4) return (n / 1e4).toFixed(1) + '만';
  return n.toLocaleString('ko-KR');
}

export function fmtPct(ratio: number, digits = 2): string {
  const pct = ratio * 100;
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(digits)}%`;
}
