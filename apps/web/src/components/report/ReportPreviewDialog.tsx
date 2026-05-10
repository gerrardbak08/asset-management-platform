// PDF 보고서 미리보기 — Radix Dialog 풀스크린 + 역할별 섹션 분기 + window.print()
import * as Dialog from '@radix-ui/react-dialog';
import { Printer, X } from 'lucide-react';
import type { M0Data } from '@aims/shared';
import { type Building } from '@/lib/api/buildings';
import { useBuildings, useMom } from '@/lib/queries';
import { useAuthStore } from '@/store/auth';
import { fmtKRfull, fmtKR, fmtPct } from '@/lib/format';
import type { AdminRole } from '@/lib/api/admin';
import { CURRENT_PERIOD as PERIOD } from '@/lib/period';

type Section = 'cover' | 'kpi' | 'matrix' | 'buildings' | 'movers' | 'risk' | 'audit';

const SECTIONS_BY_ROLE: Record<AdminRole, Section[]> = {
  viewer: ['cover', 'kpi', 'matrix', 'buildings'],
  editor: ['cover', 'kpi', 'matrix', 'buildings', 'movers', 'risk'],
  admin: ['cover', 'kpi', 'matrix', 'buildings', 'movers', 'risk', 'audit'],
  auditor: ['cover', 'kpi', 'matrix', 'risk', 'audit'],
};

type Props = { open: boolean; onClose: () => void };

export function ReportPreviewDialog({ open, onClose }: Props) {
  const role = useAuthStore((s) => s.user?.role);
  const userEmail = useAuthStore((s) => s.user?.email);
  const sections = role ? SECTIONS_BY_ROLE[role] : SECTIONS_BY_ROLE.viewer;

  const m0Q = useMom(PERIOD, open);
  const bldQ = useBuildings(open);

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm no-print" />
        <Dialog.Content className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background text-foreground">
          {/* 인쇄 시 숨김 */}
          <header className="no-print sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-4">
            <div className="flex items-center gap-3">
              <Dialog.Title className="text-heading-md font-semibold">보고서 미리보기</Dialog.Title>
              <span className="text-caption text-muted-foreground">
                역할 — {role ?? '-'} · 섹션 {sections.length}개
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-1.5 text-caption font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90"
              >
                <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                인쇄 / PDF 저장
              </button>
              <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground">
                <X className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">닫기</span>
              </Dialog.Close>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-background p-6 print:p-0">
            <article className="mx-auto max-w-3xl space-y-6 print:max-w-none">
              {sections.map((s) => {
                if (s === 'cover')
                  return (
                    <CoverSection
                      key="cover"
                      role={role ?? null}
                      email={userEmail ?? null}
                      period={PERIOD}
                    />
                  );
                if (s === 'kpi' && m0Q.data)
                  return <KpiSection key="kpi" m0={m0Q.data} />;
                if (s === 'matrix' && m0Q.data)
                  return <MatrixSection key="matrix" m0={m0Q.data} />;
                if (s === 'buildings')
                  return (
                    <BuildingsSection key="buildings" items={bldQ.data ?? []} />
                  );
                if (s === 'movers' && m0Q.data)
                  return <MoversSection key="movers" m0={m0Q.data} />;
                if (s === 'risk')
                  return <RiskSection key="risk" items={bldQ.data ?? []} />;
                if (s === 'audit')
                  return (
                    <AuditSection
                      key="audit"
                      role={role ?? null}
                      email={userEmail ?? null}
                    />
                  );
                return null;
              })}
            </article>
          </main>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="border-b border-border pb-2 text-heading-md font-semibold tracking-tight text-foreground">
      {children}
    </h2>
  );
}

function CoverSection({
  role,
  email,
  period,
}: {
  role: string | null;
  email: string | null;
  period: string;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 print:break-after-page print:break-inside-avoid">
      <div className="text-caption uppercase tracking-wider text-muted-foreground">월간 자산 보고서</div>
      <h1 className="mt-2 text-display-lg font-bold tracking-tight text-foreground">
        {period} 자산 현황
      </h1>
      <div className="mt-6 space-y-1 text-caption text-muted-foreground">
        <div>발행 — {new Date().toLocaleString('ko-KR')}</div>
        <div>발행 역할 — {role ?? '-'}</div>
        <div>발행자 — {email ?? '-'}</div>
        <div>출처 — 자산관리 플랫폼 v0.1.0</div>
      </div>
    </section>
  );
}

function KpiSection({ m0 }: { m0: M0Data }) {
  const k = m0.current.asset_kpi;
  return (
    <section className="rounded-2xl border border-border bg-card p-6 print:break-inside-avoid">
      <H2>핵심 KPI</H2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KCell label="총자산" value={fmtKRfull(k.total)} mom={fmtPct(m0.mom.total.ratio)} />
        <KCell label="유형자산" value={fmtKRfull(k.tangible.value)} mom={fmtPct(m0.mom.tangible.ratio)} />
        <KCell label="무형자산" value={fmtKRfull(k.intangible.value)} mom={fmtPct(m0.mom.intangible.ratio)} />
        <KCell label="비품" value={fmtKRfull(k.supplies.value)} mom={fmtPct(m0.mom.supplies.ratio)} />
      </div>
    </section>
  );
}

function KCell({ label, value, mom }: { label: string; value: string; mom: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <div className="text-micro uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-kpi-inline font-mono tabular-nums text-foreground">{value}</div>
      <div className="mt-0.5 text-caption text-muted-foreground">MoM {mom}</div>
    </div>
  );
}

type Row = { category: string; subcategory: string; hq: number; store: number; logistics: number; total: number };

function MatrixSection({ m0 }: { m0: M0Data }) {
  const rows = (m0.current as { asset_matrix?: Row[] }).asset_matrix ?? [];
  return (
    <section className="rounded-2xl border border-border bg-card p-6 print:break-inside-avoid">
      <H2>자산 매트릭스</H2>
      <table className="mt-4 w-full text-caption">
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            <th className="px-2 py-1.5 text-left">분류</th>
            <th className="px-2 py-1.5 text-left">세부</th>
            <th className="px-2 py-1.5 text-right">본사</th>
            <th className="px-2 py-1.5 text-right">매장</th>
            <th className="px-2 py-1.5 text-right">물류</th>
            <th className="px-2 py-1.5 text-right">합계</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const isTotal = r.category === '합계' || r.subcategory === '합계' || r.subcategory === '소계';
            return (
              <tr
                key={i}
                className={isTotal ? 'bg-muted/20 font-semibold' : 'border-t border-border'}
              >
                <td className="px-2 py-1.5">{r.category}</td>
                <td className="px-2 py-1.5">{r.subcategory}</td>
                <td className="px-2 py-1.5 text-right font-mono tabular-nums">{fmtKR(r.hq)}</td>
                <td className="px-2 py-1.5 text-right font-mono tabular-nums">{fmtKR(r.store)}</td>
                <td className="px-2 py-1.5 text-right font-mono tabular-nums">{fmtKR(r.logistics)}</td>
                <td className="px-2 py-1.5 text-right font-mono tabular-nums">{fmtKR(r.total)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function BuildingsSection({ items }: { items: Building[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 print:break-inside-avoid">
      <H2>건물 현황 ({items.length}동)</H2>
      <table className="mt-4 w-full text-caption">
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            <th className="px-2 py-1.5 text-left">건물명</th>
            <th className="px-2 py-1.5 text-left">주소</th>
            <th className="px-2 py-1.5 text-right">취득가</th>
            <th className="px-2 py-1.5 text-right">임대율</th>
            <th className="px-2 py-1.5 text-left">임차인</th>
          </tr>
        </thead>
        <tbody>
          {items.map((b) => (
            <tr key={b.id} className="border-t border-border">
              <td className="px-2 py-1.5">{b.name}</td>
              <td className="px-2 py-1.5">{b.address}</td>
              <td className="px-2 py-1.5 text-right font-mono tabular-nums">
                {fmtKR(Number(b.acquisitionPrice))}원
              </td>
              <td className="px-2 py-1.5 text-right font-mono tabular-nums">{b.rental.rate}%</td>
              <td className="px-2 py-1.5">{b.tenant}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function MoversSection({ m0 }: { m0: M0Data }) {
  const top = m0.movers?.top_up?.slice(0, 5) ?? [];
  return (
    <section className="rounded-2xl border border-border bg-card p-6 print:break-inside-avoid">
      <H2>상승 변동 TOP 5</H2>
      {top.length === 0 ? (
        <p className="mt-3 text-caption text-muted-foreground">변동 데이터 없음.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {top.map((m) => (
            <li
              key={`${m.category}-${m.subcategory}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3"
            >
              <div className="min-w-0">
                <div className="truncate text-body font-medium text-foreground">{m.subcategory}</div>
                <div className="truncate text-caption text-muted-foreground">{m.category}</div>
              </div>
              <div className="flex shrink-0 items-center gap-3 font-mono tabular-nums">
                <span className="text-foreground">+{fmtKR(m.delta)}원</span>
                <span className="text-success">{fmtPct(m.ratio)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RiskSection({ items }: { items: Building[] }) {
  const danger = items.filter((b) => b.rental.rate === 0 && b.tenant !== '-');
  const warning = items.filter((b) => b.rental.rate > 0 && b.rental.rate < 50);
  return (
    <section className="rounded-2xl border border-border bg-card p-6 print:break-inside-avoid">
      <H2>위험도 분류</H2>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <RiskList tone="danger" title="위험 (임대율 0%)" items={danger} />
        <RiskList tone="warning" title="주의 (임대율 50% 미만)" items={warning} />
      </div>
    </section>
  );
}

function RiskList({
  tone,
  title,
  items,
}: {
  tone: 'danger' | 'warning';
  title: string;
  items: Building[];
}) {
  const subtle = tone === 'danger' ? 'bg-danger-subtle border-danger-border' : 'bg-warning-subtle border-warning-border';
  const text = tone === 'danger' ? 'text-danger' : 'text-warning';
  return (
    <div className={`rounded-xl border p-3 ${subtle}`}>
      <div className={`mb-2 text-caption font-semibold ${text}`}>{title}</div>
      {items.length === 0 ? (
        <p className="text-caption text-muted-foreground">해당 없음</p>
      ) : (
        <ul className="space-y-1 text-caption">
          {items.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-2">
              <span className="truncate text-foreground">{b.name}</span>
              <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
                {b.rental.rate}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AuditSection({ role, email }: { role: string | null; email: string | null }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 print:break-inside-avoid">
      <H2>감사 추적 (admin/auditor 전용)</H2>
      <div className="mt-4 space-y-2 text-caption">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">발행자</span>
          <span className="font-mono text-foreground">{email ?? '-'}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">발행 역할</span>
          <span className="font-mono text-foreground">{role ?? '-'}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">발행 시각</span>
          <span className="font-mono text-foreground">{new Date().toISOString()}</span>
        </div>
        <p className="mt-3 text-muted-foreground">
          상세 audit_logs 는 2단계에 도입되며, 본 보고서는 발행 시각 기준의 데이터만 포함합니다.
        </p>
      </div>
    </section>
  );
}
