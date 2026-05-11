// ASUNG CI 심볼 — 로컬 PNG(468×84) 에서 A 마크만 정밀 크롭
// 심볼 끝 x=107, 텍스트 시작 x=124 (gap 존재). 컨테이너 너비 48px으로 텍스트 완전 차단.
// 렌더 높이 36px → scale=36/84=0.4286 → 이미지 201px × 36px
export function AsungSymbol({ className }: { className?: string }) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-block',
        backgroundImage: `url('/img-logo-asung.png')`,
        backgroundSize: '155px 28px',
        backgroundPosition: '0px 0px',
        backgroundRepeat: 'no-repeat',
        width: '37px',
        height: '28px',
        flexShrink: 0,
      }}
      role="img"
      aria-label="ASUNG"
    />
  );
}
