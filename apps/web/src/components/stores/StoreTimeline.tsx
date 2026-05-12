// 사업장 활동 타임라인 — 컴팩트 그리드 레이아웃
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
import { fmtKR } from '@/lib/format';

type Event = {
  icon: LucideIcon;
  tone: 'primary' | 'info' | 'success' | 'accent' | 'muted';
  title: string;
  detail: string;
};

const TONE_CLASSES: Record<Event['tone'], string> = {
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
      detail: `${detail.period} · ${fmtKR(detail.assetValue)}원 · ${detail.assetCount.toLocaleString('ko-KR')}건`,
    });

    const supplyEntries = Object.entries(detail.supplyByCategory ?? {})
      .map(([cat, amt]) => ({ cat, amt: Number(amt) }))
      .sort((a, b) => b.amt - a.amt);
    const top = supplyEntries[0];
    if (top && top.amt > 0) {
      out.push({
        icon: Boxes,
        tone: 'accent',
        title: `최대 — ${top.cat}`,
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
        title: `유형 1위 — ${topType.k}`,
        detail: `${fmtKR(topType.v)}원`,
      });
    }
    if (typeEntries.length >= 2) {
      const last = typeEntries[typeEntries.length - 1];
      if (last && last.v > 0) {
        out.push({
          icon: ArrowDown,
          tone: 'muted',
          title: `유형 최저 — ${last.k}`,
          detail: `${fmtKR(last.v)}원`,
        });
      }
    }

    if (detail.supplyValue > 0) {
      out.push({
        icon: Boxes,
        tone: 'success',
        title: '비품 재고',
        detail: `${fmtKR(detail.supplyValue)}원 · ${Object.keys(detail.supplyByCategory ?? {}).length}종`,
      });
    }

    out.push({
      icon: Clock,
      tone: 'muted',
      title: '기준일',
      detail: `${detail.period} 마감`,
    });
    return out;
  }, [detail]);

  return (
    <Card className="p-2.5">
      <div className="mb-1.5 text-[10px] font-bold text-foreground">활동 타임라인</div>
      <div className="grid grid-cols-3 gap-1.5 lg:grid-cols-6">
        {events.map((e, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 rounded-md border border-border/40 bg-muted/20 px-2 py-1.5"
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${TONE_CLASSES[e.tone]}`}
            >
              <e.icon className="h-2.5 w-2.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[9px] font-semibold leading-tight text-foreground truncate">
                {e.title}
              </div>
              <div className="text-[8px] leading-snug text-muted-foreground truncate">
                {e.detail}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
