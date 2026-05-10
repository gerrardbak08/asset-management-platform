// 건물 사진 라이트박스 — V16 건물 상세 카드의 사진 클릭 → 풀스크린 확대 + 대표/상세 토글
import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LightboxPhoto = { url: string; label: string };

type Props = {
  open: boolean;
  onClose: () => void;
  photos: LightboxPhoto[];
  initialIndex?: number;
  alt: string;
};

export function PhotoLightbox({ open, onClose, photos, initialIndex = 0, alt }: Props) {
  const [idx, setIdx] = useState(initialIndex);

  useEffect(() => {
    if (open) setIdx(Math.max(0, Math.min(initialIndex, photos.length - 1)));
  }, [open, initialIndex, photos.length]);

  useEffect(() => {
    if (!open || photos.length < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % photos.length);
      else if (e.key === 'ArrowLeft') setIdx((i) => (i - 1 + photos.length) % photos.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, photos.length]);

  if (photos.length === 0) return null;
  const cur = photos[idx] ?? photos[0]!;
  const showNav = photos.length > 1;

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-0 z-[70] flex flex-col items-center justify-center p-6 outline-none">
          <Dialog.Title className="sr-only">
            {alt} — {cur.label}
          </Dialog.Title>
          <Dialog.Close
            aria-label="닫기"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white/80 transition-colors duration-150 hover:bg-white/20 hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Dialog.Close>

          <img
            src={cur.url}
            alt={`${alt} — ${cur.label}`}
            className="max-h-[85vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
          />

          {showNav && (
            <>
              <button
                type="button"
                aria-label="이전 사진"
                onClick={() => setIdx((i) => (i - 1 + photos.length) % photos.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white/80 transition-colors duration-150 hover:bg-white/20 hover:text-white"
              >
                <ChevronLeft className="h-6 w-6" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="다음 사진"
                onClick={() => setIdx((i) => (i + 1) % photos.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white/80 transition-colors duration-150 hover:bg-white/20 hover:text-white"
              >
                <ChevronRight className="h-6 w-6" aria-hidden="true" />
              </button>

              <div className="mt-4 flex gap-2">
                {photos.map((p, i) => (
                  <button
                    key={p.url}
                    type="button"
                    onClick={() => setIdx(i)}
                    className={cn(
                      'rounded-full px-3 py-1 text-caption font-medium transition-colors duration-150',
                      idx === i
                        ? 'bg-white text-black'
                        : 'bg-white/15 text-white/80 hover:bg-white/25',
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
