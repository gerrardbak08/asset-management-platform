// 사업장 활동 타임라인 — V16 renderStoreTimeline 동등. 카테고리 변동·자산 항목·갱신 이력 (1단계 — 합성 이벤트)
import { useMemo } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Boxes,
  Building2,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import type { StoreDetail } from '@/lib/api/stores';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/features/dashboard/SectionHeader';
import { fmtKR } from '@/lib/format';

type Event = {
  icon: LucideIcon;
  tone: 'primary' | 'info' | 'success' | 'accent' | 'muted';
  title: string;
  detail: string;
};

const TONE_BG: Record<Event['tone'], string> = {
  primary: 'bg-primary/10 text-primary',
  info: 'bg-info-subtle text-info',
  success: 'bg-success-subtle text-success',
  accent: 'bg-accent-subtle text-accent',
  muted: 'bg-muted text-muted-foreground',
};

type Props = { detail: StoreDetail };

export function StoreTimeline({ detail }: Props) {
  const events = useMemo<Event[]>(() => {
    const out: Event[] = [];
    out.push({
      icon: Building2,
      tone: 'primary',
      title: '사업장 등록',
      detail: `${detail.period} 기준 자산 ${fmtKR(detail.assetValue)}원 · 항목 ${detail.assetCount.toLocaleString('ko-KR')}건`,
    });

    const supplyEntries = Object.entries(detail.supplyByCategory ?? {})
      .map(([cat, amt]) => ({ cat, amt: Number(amt) }))
      .sort((a, b) => b.amt - a.amt);
    const top = supplyEntries[0];
    if (top && top.amt > 0) {
      out.push({
        icon: Boxes,
        tone: 'accent',
        title: `최대 카테고리 — ${top.cat}`,
        detail: `${fmtKR(top.amt)}원`,
      });
    }

    const typeEntries = Object.entries(detail.assetByType ?? {})
      .map(([k, v]) => ({ k, v: Number(v) }))
      .sort((a, b) => b.v - a.v);
    const topType = typeEntries[0];
    if (topType && topType.v > 0) {
      out.push({
        icon: ArrowUp,
        tone: 'info',
        title: `자산 유형 1순위 — ${topType.k}`,
        detail: `${fmtKR(topType.v)}원`,
      });
    }
    if (typeEntries.length >= 2) {
      const last = typeEntries[typeEntries.length - 1];
      if (last && last.v > 0) {
        out.push({
          icon: ArrowDown,
          tone: 'muted',
          title: `자산 유형 최저 — ${last.k}`,
          detail: `${fmtKR(last.v)}원`,
        });
      }
    }

    if (detail.supplyValue > 0) {
      out.push({
        icon: Boxes,
        tone: 'success',
        title: '비품 재고 보유',
        detail: `${fmtKR(detail.supplyValue)}원 · ${Object.keys(detail.supplyByCategory ?? {}).length} 카테고리`,
      });
    }

    out.push({
      icon: Clock,
      tone: 'muted',
      title: '데이터 기준',
      detail: `${detail.period} 마감 (수동 또는 xlsb 업로드)`,
    });
    return out;
  }, [detail]);

  return (
    <Card className="flex h-full min-h-[160px] w-full max-w-full flex-col p-4">
      <SectionHeader title="활동 타임라인" />
      <ol className="relative mt-4 flex min-h-0 flex-1 w-full gap-4 overflow-x-auto border-t-2 border-border pt-12 pb-2 custom-scrollbar">
        {events.map((e, i) => (
          <li key={i} className="relative w-[160px] shrink-0">
            {/* 타임라인 연결 점선 및 점 */}
            <div
              className="absolute -top-[48px] left-[12px] h-[34px] w-[1px] border-l border-dashed border-border/60"
              aria-hidden="true"
            />
            <div
              className="absolute -top-[48px] left-[12px] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-border"
              aria-hidden="true"
            />

            <span
              aria-hidden="true"
              className={`absolute -top-[14px] left-0 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full ${TONE_BG[e.tone]} ring-4 ring-card shadow-sm`}
            >
              <e.icon className="h-3.5 w-3.5" />
            </span>
            <div className="text-micro font-bold leading-tight text-foreground">
              {e.title}
            </div>
            <div className="mt-1 text-[10px] leading-snug text-muted-foreground">
              {e.detail}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
