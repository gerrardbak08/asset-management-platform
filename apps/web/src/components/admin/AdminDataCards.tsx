// 관리자 패널의 5종 데이터 카드 — V16 admin 패널 동등. 카운트 + 양식 다운로드 + 데이터 페이지 링크
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Boxes,
  Building,
  Database,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Store as StoreIcon,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { adminApi } from '@/lib/api/admin';
import { uploadApi } from '@/lib/api/upload';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/features/dashboard/SectionHeader';
import type { CsvType } from '@/lib/api/upload';

type CardDef = {
  type: CsvType;
  label: string;
  icon: LucideIcon;
  countOf: (s: AdminStatsLite) => string;
};

type AdminStatsLite = {
  buildings: number;
  equipments: number;
  equipmentSnapshots: number;
  stores: number;
  monthlySnapshots: number;
};

const CARDS: CardDef[] = [
  {
    type: 'asset',
    label: '자산 매트릭스 (비품)',
    icon: Boxes,
    countOf: (s) => `비품 스냅샷 ${s.equipmentSnapshots.toLocaleString('ko-KR')} 행`,
  },
  {
    type: 'ledger_asset',
    label: '원장 — 자산',
    icon: Database,
    countOf: (s) => `사업장 ${s.stores.toLocaleString('ko-KR')} 건`,
  },
  {
    type: 'ledger_eq',
    label: '원장 — 비품 재고',
    icon: StoreIcon,
    countOf: (s) => `사업장 ${s.stores.toLocaleString('ko-KR')} 건`,
  },
  {
    type: 'eq_ops',
    label: '비품 운영',
    icon: Wrench,
    countOf: (s) => `비품 ${s.equipments.toLocaleString('ko-KR')} 종`,
  },
  {
    type: 'buildings',
    label: '건물 현황',
    icon: Building,
    countOf: (s) => `${s.buildings.toLocaleString('ko-KR')} 동`,
  },
];

export function AdminDataCards() {
  const stats = useQuery({ queryKey: ['admin', 'stats'], queryFn: adminApi.stats });
  return (
    <Card className="p-5">
      <SectionHeader
        title="5종 데이터"
        description="V16 데이터 카드 동등 — 양식 다운로드와 빠른 데이터 페이지 진입"
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => (
          <DataCard key={c.type} card={c} stats={stats.data ?? null} />
        ))}
      </div>
    </Card>
  );
}

function DataCard({ card, stats }: { card: CardDef; stats: AdminStatsLite | null }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <card.icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="text-caption font-semibold text-foreground">{card.label}</div>
        </div>
      </div>
      <div className="mt-2 text-caption text-muted-foreground">
        {stats ? card.countOf(stats) : '로딩 중…'}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <a
          href={uploadApi.templateUrl(card.type)}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-caption text-foreground transition-colors duration-150 hover:bg-muted"
        >
          <Download className="h-3 w-3" aria-hidden="true" />
          양식
        </a>
        <Link
          to="/data"
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-caption font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90"
        >
          <FileSpreadsheet className="h-3 w-3" aria-hidden="true" />
          업로드
          <ExternalLink className="ml-0.5 h-3 w-3" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
