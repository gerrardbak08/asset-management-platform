// 데이터 관리 — CSV 5종 업로드 카드 (V16 데이터 관리 동등)
import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart2,
  Building2,
  Package,
  RefreshCw,
  Building,
  Download,
  Upload as UploadIcon,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { uploadApi, type CsvType, type CsvUploadResult } from '@/lib/api/upload';
import { useAuthStore } from '@/store/auth';
import { PageShell } from '@/components/ui/PageShell';

type CardDef = {
  type: CsvType;
  label: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  columns: string[];
};

const CARDS: CardDef[] = [
  {
    type: 'asset',
    label: '자산현황',
    description: '자산 집계 (유형/무형/비품)',
    icon: BarChart2,
    iconBg: 'bg-warning/15',
    iconColor: 'text-warning',
    columns: ['구분', '세부', '본사', '매장', '물류', '합계'],
  },
  {
    type: 'ledger_asset',
    label: '원장_자산',
    description: '자산 개별 레코드 (유형/무형자산)',
    icon: Building2,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    columns: ['자산유형', '자산번호', '자산명', '사업장', '취득일자', '기초가액', '당월발장부가액'],
  },
  {
    type: 'ledger_eq',
    label: '원장_비품_재고',
    description: '비품 개별 비품 재고 현황',
    icon: Package,
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent',
    columns: ['관리번호', '비품명', '구매가', '입고일자', '폐기일자', '사업장', '중분류'],
  },
  {
    type: 'eq_ops',
    label: '비품 운영 (구매·이동·폐기)',
    description: '월별 비품 흐름 데이터',
    icon: RefreshCw,
    iconBg: 'bg-info/10',
    iconColor: 'text-info',
    columns: ['카테고리', '재고금액', '구매금액', '이동금액', '폐기금액', '수량'],
  },
  {
    type: 'buildings',
    label: '건물현황',
    description: '건물 기본 정보 및 임대 현황',
    icon: Building,
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    columns: ['건물명', '주소', '용도', '취득가액', '임대율', '공실률', '연면적'],
  },
];

export default function Data() {
  const role = useAuthStore((s) => s.user?.role);
  const logout = useAuthStore((s) => s.logout);
  const canEdit = role === 'admin' || role === 'editor';

  return (
    <PageShell
      title="데이터 관리"
      description="엑셀·CSV 파일을 업로드해서 대시보드 데이터를 갱신합니다"
      action={
        <button
          type="button"
          onClick={() => void logout()}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-body font-medium text-foreground transition-colors duration-150 hover:bg-muted"
        >
          <LogOut className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          로그아웃
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {CARDS.map((c) => (
          <DataUploadCard key={c.type} card={c} canEdit={canEdit} />
        ))}
      </div>
    </PageShell>
  );
}

function DataUploadCard({ card, canEdit }: { card: CardDef; canEdit: boolean }) {
  const ref = useRef<HTMLInputElement | null>(null);
  const [result, setResult] = useState<CsvUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();
  const Icon = card.icon;

  const mut = useMutation({
    mutationFn: (file: File) =>
      uploadApi.csv(card.type, file, card.type !== 'buildings' ? '2026-03' : undefined),
    onSuccess: (data) => {
      setResult(data);
      void qc.invalidateQueries();
    },
    onError: (err) => setError(err instanceof Error ? err.message : '업로드 실패'),
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setError(null);
    setResult(null);
    mut.mutate(f);
  };

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="text-heading-sm font-semibold leading-tight text-foreground">
            {card.label}
          </div>
          <div className="mt-0.5 text-caption text-muted-foreground">{card.description}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 text-caption font-medium text-muted-foreground">필수 열</div>
        <div className="flex flex-wrap gap-1">
          {card.columns.map((col) => (
            <span
              key={col}
              className="rounded-md bg-muted px-1.5 py-0.5 text-micro text-muted-foreground"
            >
              {col}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-auto flex gap-2 pt-4">
        <a
          href={uploadApi.templateUrl(card.type)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-2 text-caption font-medium text-foreground transition-colors duration-150 hover:bg-muted"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          양식 다운로드
        </a>
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={!canEdit || mut.isPending}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-caption font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90 disabled:opacity-50"
        >
          <UploadIcon className="h-3.5 w-3.5" aria-hidden="true" />
          {mut.isPending ? '업로드 중…' : '파일 선택'}
        </button>
      </div>

      <input ref={ref} type="file" accept=".csv" className="hidden" onChange={onChange} />

      {error ? (
        <p className="mt-2 text-caption text-danger">{error}</p>
      ) : result ? (
        <p className="mt-2 text-caption text-success">
          {result.rowsApplied}/{result.totalRows} 행 적용 완료
        </p>
      ) : null}
    </div>
  );
}
