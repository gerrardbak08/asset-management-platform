// 숫자 포맷터 — V16 의 fmtKR / fmtKRfull 동등 보존
export function fmtKR(n: number): string {
  if (!n || n === 0) return '-';
  if (n >= 1e12) return (n / 1e12).toFixed(2) + '조';
  if (n >= 1e8) return (n / 1e8).toFixed(0) + '억';
  if (n >= 1e4) return (n / 1e4).toFixed(0) + '만';
  return n.toLocaleString('ko-KR');
}

export function fmtKRfull(n: number): string {
  if (!n || n === 0) return '-';
  if (n >= 1e12) return (n / 1e12).toFixed(2) + '조원';
  if (n >= 1e8) return (n / 1e8).toFixed(1) + '억원';
  if (n >= 1e4) return (n / 1e4).toFixed(0) + '만원';
  return n.toLocaleString('ko-KR') + '원';
}

export function fmtPct(ratio: number, digits = 2): string {
  const pct = ratio * 100;
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(digits)}%`;
}
