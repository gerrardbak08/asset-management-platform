// 사진 fallback — primary (DB photoUrl) → fallback (DB detailPhotoUrl) → EmptyState 카드 (V16 4단계 fallback 의 1단계 통합)
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
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={cn('object-cover', className)}
    />
  );
}
