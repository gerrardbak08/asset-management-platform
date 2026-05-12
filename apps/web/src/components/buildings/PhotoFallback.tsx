// 사진 fallback — primary (DB photoUrl) → fallback (DB detailPhotoUrl) → EmptyState 카드
import { useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  primary?: string | null;
  fallback?: string | null;
  alt: string;
  className?: string;
};

// 한글 파일명 → 영문 매핑 (빌드/배포 환경에서 한글 깨짐 방지용)
const PHOTO_ALIAS: Record<string, string> = {
  '속초본점.jpg': 'b001.jpg',
  '창원상남본점.jpg': 'b002.jpg',
  '창원상남본점_detail.jpg': 'b002_detail.jpg',
  '구로디지털단지역점.jpg': 'b003.jpg',
  '강릉입암점.jpg': 'b004.jpg',
  '세종본점.jpg': 'b005.jpg',
  '포항시외버스터미널점.jpg': 'b006.jpg',
  '경기광주본점.jpg': 'b007.jpg',
  '원주무실점.jpg': 'b008.jpg',
  '수원화서점.jpg': 'b009.jpg',
  '성남모란역점.jpg': 'b010.jpg',
  '영주본점.jpg': 'b011.jpg',
  '남사물류센터.jpg': 'b012.jpg',
  '부산허브센터.jpg': 'b013.jpg',
  '동탄현대하이페리온_511호.jpg': 'b014.jpg',
  '동탄현대하이페리온_526호.jpg': 'b015.jpg',
};

function toEnglishPath(url: string): string {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  if (filename && PHOTO_ALIAS[filename]) {
    parts[parts.length - 1] = PHOTO_ALIAS[filename]!;
    return parts.join('/');
  }
  return url;
}

export function PhotoFallback({ primary, fallback, alt, className }: Props) {
  const src = primary ?? fallback;
  // 0: 최적화(원본 한글) → 1: 최적화(영문 alias) → 2: 직접(원본) → 3: 직접(영문) → 4: 실패
  const [stage, setStage] = useState(0);

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

  const enSrc = toEnglishPath(src);

  let currentSrc: string;
  if (stage === 0) {
    currentSrc = `/api/images/optimized?src=${encodeURIComponent(src)}&w=600&q=75`;
  } else if (stage === 1 && enSrc !== src) {
    currentSrc = `/api/images/optimized?src=${encodeURIComponent(enSrc)}&w=600&q=75`;
  } else if (stage <= 2) {
    currentSrc = src;
  } else if (stage === 3 && enSrc !== src) {
    currentSrc = enSrc;
  } else {
    // 모든 시도 실패 — placeholder
    return (
      <div className={cn('flex items-center justify-center bg-muted', className)}>
        <div className="flex flex-col items-center text-muted-foreground">
          <ImageIcon className="mb-2 h-8 w-8" aria-hidden="true" />
          <span className="text-caption">사진 로딩 실패</span>
        </div>
      </div>
    );
  }

  return (
    <img
      key={stage}
      src={currentSrc}
      alt={alt}
      loading="lazy"
      onError={() => setStage((s) => s + 1)}
      className={cn('object-cover', className)}
    />
  );
}
