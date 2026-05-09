// 공용 유틸 — clsx + tailwind-merge 결합한 cn() 헬퍼 (조건부 클래스 + 충돌 해결)
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
