// 사진 fallback — primary (DB photoUrl) → fallback (DB detailPhotoUrl) → EmptyState 카드 (V16 4단계 fallback 의 1단계 통합)
import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  primary?: string | null;
  fallback?: string | null;
  alt: string;
  className?: string;
};

export function PhotoFallback({ primary, fallback, alt, className }: Props) {
  const src = primary ?? fallback;
  const [useOptimized, setUseOptimized] = useState(true);

  if (!src) {
    return (
      <div className={cn('flex items-center justify-center bg-muted', className)}>
        <div className="flex flex-col items-center text-muted-foreground">
          <ImageIcon className="mb-2 h-8 w-8" aria-hidden="true" />
          <span className="text-caption">사진 미등록</span>
        </div>
      </div>
    );
  }

  // 최적화 URL 시도 → 실패 시 원본 URL 직접 사용
  const optimizedSrc = `/api/images/optimized?src=${encodeURIComponent(src)}&w=600&q=75`;
  const directSrc = src;

  return (
    <img
      src={useOptimized ? optimizedSrc : directSrc}
      alt={alt}
      loading="lazy"
      onError={() => {
        if (useOptimized) {
          setUseOptimized(false);
        }
      }}
      className={cn('object-cover', className)}
    />
  );
}
