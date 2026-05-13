// 통합 관리 페이지 — 관리자 재인증 게이트 + 데이터 관리 탭 + 시스템 관리 탭
import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart2, Building2, Package, RefreshCw, Building,
  Download, Upload as UploadIcon, KeyRound, UserPlus,
  Trash2, Shield, Lock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { adminApi, type AdminRole, type AdminUser } from '@/lib/api/admin';
import { uploadApi, type CsvType, type CsvUploadResult } from '@/lib/api/upload';
import { useAuthStore } from '@/store/auth';
import { PageShell } from '@/components/ui/PageShell';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/features/dashboard/SectionHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChangePasswordDialog } from '@/components/admin/ChangePasswordDialog';
import { cn } from '@/lib/utils';

const ROLES: AdminRole[] = ['admin', 'editor', 'viewer', 'auditor'];

type Tab = 'data' | 'system' | 'adjust';
type AdjustSubTab = 'monthly' | 'supplies' | 'buildings';

const ADJUST_ROWS = [
  { key: 'totalAsset',       label: '총자산규모' },
  { key: 'buildingAsset',    label: '건물자산금액' },
  { key: 'suppliesStock',    label: '비품재고액' },
  { key: 'suppliesBuy',      label: '비품구매금액' },
  { key: 'suppliesMove',     label: '비품이동금액' },
  { key: 'suppliesDisposal', label: '비품폐기금액' },
] as const;

// ── CSV 카드 정의 ──────────────────────────────────────────
type CardDef = { type: CsvType; label: string; description: string; icon: LucideIcon; iconBg: string; iconColor: string; columns: string[] };
const CARDS: CardDef[] = [
  { type: 'asset',      label: '자산현황',            description: '자산 집계 (유형/무형/비품)',          icon: BarChart2,  iconBg: 'bg-warning/15', iconColor: 'text-warning', columns: ['구분','세부','본사','매장','물류','합계'] },
  { type: 'ledger_asset', label: '원장_자산',          description: '자산 개별 레코드 (유형/무형자산)',    icon: Building2,  iconBg: 'bg-primary/10', iconColor: 'text-primary', columns: ['자산유형','자산번호','자산명','사업장','취득일자','기초가액','당월발장부가액'] },
  { type: 'ledger_eq',  label: '원장_비품_재고',       description: '비품 개별 재고 현황',                 icon: Package,    iconBg: 'bg-accent/10',  iconColor: 'text-accent',  columns: ['관리번호','비품명','구매가','입고일자','폐기일자','사업장','중분류'] },
  { type: 'eq_ops',     label: '비품 운영 (구매·이동·폐기)', description: '월별 비품 흐름 데이터',         icon: RefreshCw,  iconBg: 'bg-info/10',    iconColor: 'text-info',    columns: ['카테고리','재고금액','구매금액','이동금액','폐기금액','수량'] },
  { type: 'buildings',  label: '건물현황',             description: '건물 기본 정보 및 임대 현황',         icon: Building,   iconBg: 'bg-success/10', iconColor: 'text-success', columns: ['건물명','주소','용도','취득가액','임대율','공실률','연면적'] },
];

// ── 메인 페이지 ────────────────────────────────────────────
export default function Admin() {
  const me = useAuthStore((s) => s.user);
  const isAdmin = me?.role === 'admin';
  const canEdit = me?.role === 'admin' || me?.role === 'editor';

  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<Tab>('data');
  const [pwOpen, setPwOpen] = useState(false);

  if (!unlocked) {
    return <AdminLoginGate onUnlock={() => setUnlocked(true)} userEmail={me?.email ?? ''} />;
  }

  return (
    <PageShell
      title="관리"
      description="데이터 업로드 · 시스템 설정"
      action={
        <button
          type="button"
          onClick={() => setPwOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-body font-medium text-foreground transition-colors duration-150 hover:bg-muted"
        >
          <KeyRound className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          비밀번호 변경
        </button>
      }
    >
      {/* 탭 */}
      <div className="flex gap-1 rounded-xl bg-muted p-1 self-start">
        <TabBtn active={tab === 'data'} onClick={() => setTab('data')}>데이터 관리</TabBtn>
        <TabBtn active={tab === 'adjust'} onClick={() => setTab('adjust')}>데이터 조정</TabBtn>
        <TabBtn active={tab === 'system'} onClick={() => setTab('system')}>
          <Shield className="h-3.5 w-3.5" aria-hidden="true" />
          시스템 관리
        </TabBtn>
      </div>

      {tab === 'data' && <DataTab canEdit={canEdit} />}
      {tab === 'adjust' && <DataAdjustTab canEdit={canEdit} />}
      {tab === 'system' && <SystemTab isAdmin={isAdmin} me={me} />}

      <ChangePasswordDialog open={pwOpen} onClose={() => setPwOpen(false)} />
    </PageShell>
  );
}

// ── 관리자 재인증 게이트 ───────────────────────────────────
function AdminLoginGate({ onUnlock, userEmail }: { onUnlock: () => void; userEmail: string }) {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.login(userEmail, password);
      onUnlock();
    } catch {
      setError('비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-background/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-elev-3">
        {/* 아이콘 */}
        <div className="flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Lock className="h-7 w-7 text-primary" aria-hidden="true" />
          </span>
        </div>

        {/* 제목 */}
        <div className="mt-4 text-center">
          <h2 className="text-heading-md font-bold text-foreground">관리자 로그인</h2>
          <p className="mt-1 text-caption text-muted-foreground">데이터 관리 패널 접근</p>
        </div>

        {/* 폼 */}
        <form onSubmit={submit} className="mt-6 space-y-3">
          <div>
            <label className="mb-1 block text-caption font-medium text-muted-foreground">
              아이디
            </label>
            <input
              type="text"
              value={userEmail}
              readOnly
              className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-body text-foreground focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-caption font-medium text-muted-foreground">
              비밀번호
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error ? (
            <p className="text-caption text-danger">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-2.5 text-body font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? '확인 중…' : '로그인'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full rounded-xl border border-border bg-muted/40 py-2.5 text-body font-medium text-foreground transition-colors hover:bg-muted"
          >
            취소
          </button>
        </form>
      </div>
    </div>
  );
}

// ── 데이터 관리 탭 ─────────────────────────────────────────
function DataTab({ canEdit }: { canEdit: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {CARDS.map((c) => (
        <DataUploadCard key={c.type} card={c} canEdit={canEdit} />
      ))}
    </div>
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
    onSuccess: (data) => { setResult(data); void qc.invalidateQueries(); },
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
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-elev-1">
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <div className="text-heading-sm font-semibold leading-tight text-foreground">{card.label}</div>
          <div className="mt-0.5 text-caption text-muted-foreground">{card.description}</div>
        </div>
      </div>
      <div className="mt-4">
        <div className="mb-1.5 text-caption font-medium text-muted-foreground">필수 열</div>
        <div className="flex flex-wrap gap-1">
          {card.columns.map((col) => (
            <span key={col} className="rounded-md bg-muted px-1.5 py-0.5 text-micro text-muted-foreground">{col}</span>
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
        <p className="mt-2 text-caption text-success">{result.rowsApplied}/{result.totalRows} 행 적용 완료</p>
      ) : null}
    </div>
  );
}

// ── 시스템 관리 탭 ─────────────────────────────────────────
function SystemTab({ isAdmin, me }: { isAdmin: boolean; me: { id: string; email: string; role: string } | null }) {
  const qc = useQueryClient();

  const stats = useQuery({ queryKey: ['admin', 'stats'], queryFn: adminApi.stats, enabled: isAdmin });
  const users = useQuery({ queryKey: ['admin', 'users'], queryFn: adminApi.users, enabled: isAdmin });

  const createMut = useMutation({
    mutationFn: (v: { email: string; password: string; role: AdminRole }) => adminApi.createUser(v.email, v.password, v.role),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); qc.invalidateQueries({ queryKey: ['admin', 'stats'] }); },
  });
  const updateMut = useMutation({
    mutationFn: (v: { id: string; role?: AdminRole }) => adminApi.updateUser(v.id, { role: v.role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); qc.invalidateQueries({ queryKey: ['admin', 'stats'] }); },
  });

  if (!isAdmin) {
    return (
      <Card className="p-5">
        <EmptyState icon={Shield} title="admin 전용" description="시스템 관리 탭은 admin 역할만 접근 가능합니다." />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card className="p-5">
        <SectionHeader title="시스템 통계" description="현재 DB 상태" />
        {stats.data ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="사용자"       value={stats.data.users} />
            <Stat label="건물"         value={stats.data.buildings} />
            <Stat label="비품 품목"    value={stats.data.equipments} />
            <Stat label="비품 스냅샷"  value={stats.data.equipmentSnapshots} />
            <Stat label="사업장"       value={stats.data.stores} />
            <Stat label="월별 스냅샷"  value={stats.data.monthlySnapshots} />
            <Stat label="기준월 수"    value={stats.data.periods.length} />
            <Stat label="최신 기준월"  value={stats.data.periods[0] ?? '-'} mono={false} />
          </div>
        ) : (
          <p className="text-caption text-muted-foreground">로딩 중…</p>
        )}
      </Card>

      <Card className="p-5">
        <SectionHeader title="사용자 추가" description="역할별 계정 생성" />
        <CreateForm onCreate={(v) => createMut.mutate(v)} pending={createMut.isPending} />
        {createMut.isError ? (
          <p className="mt-2 text-caption text-danger">생성 실패 — {createMut.error.message}</p>
        ) : null}
      </Card>

      <Card className="overflow-hidden">
        <div className="p-5 pb-3">
          <SectionHeader title="사용자 목록" description={`${users.data?.length ?? 0} 명`} />
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full whitespace-nowrap">
            <thead className="bg-muted/40 text-caption text-muted-foreground">
              <tr>
                <Th>이메일</Th><Th>역할</Th><Th>생성일</Th><Th align="right">작업</Th>
              </tr>
            </thead>
            <tbody>
              {(users.data ?? []).map((u) => (
                <UserRow
                  key={u.id} user={u} isMe={u.id === me?.id}
                  onChangeRole={(role) => updateMut.mutate({ id: u.id, role })}
                  onDelete={() => deleteMut.mutate(u.id)}
                />
              ))}
              {users.data?.length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-caption text-muted-foreground">사용자 없음</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── 공통 서브 컴포넌트 ──────────────────────────────────────
function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-body font-medium transition-colors duration-150',
        active ? 'bg-card text-foreground shadow-elev-1' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function Stat({ label, value, mono = true }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <div className="text-caption text-muted-foreground">{label}</div>
      <div className={cn('mt-1 font-kpi-inline text-foreground', mono ? 'font-mono tabular-nums' : 'font-sans')}>
        {typeof value === 'number' ? value.toLocaleString('ko-KR') : value}
      </div>
    </div>
  );
}

function CreateForm({ onCreate, pending }: { onCreate: (v: { email: string; password: string; role: AdminRole }) => void; pending: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AdminRole>('viewer');
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onCreate({ email, password, role });
    setEmail(''); setPassword('');
  };
  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr,1fr,140px,auto]">
      <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com"
        className="rounded-lg border border-border bg-card px-3 py-2 text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
      <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호 (8자 이상)"
        className="rounded-lg border border-border bg-card px-3 py-2 text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
      <select value={role} onChange={(e) => setRole(e.target.value as AdminRole)}
        className="rounded-lg border border-border bg-card px-3 py-2 text-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      <button type="submit" disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-body font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90 disabled:opacity-50">
        <UserPlus className="h-4 w-4" aria-hidden="true" />추가
      </button>
    </form>
  );
}

function UserRow({ user, isMe, onChangeRole, onDelete }: { user: AdminUser; isMe: boolean; onChangeRole: (r: AdminRole) => void; onDelete: () => void }) {
  return (
    <tr className="border-t border-border">
      <Td>{user.email}{isMe ? <span className="ml-2 text-caption text-muted-foreground">(본인)</span> : null}</Td>
      <Td>
        <select value={user.role} disabled={isMe} onChange={(e) => onChangeRole(e.target.value as AdminRole)}
          className="rounded-lg border border-border bg-card px-2 py-1 text-caption text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60">
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </Td>
      <Td>{new Date(user.createdAt).toLocaleDateString('ko-KR')}</Td>
      <Td align="right">
        <button type="button" disabled={isMe} onClick={() => { if (confirm(`${user.email} 삭제?`)) onDelete(); }}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-caption text-danger transition-colors hover:bg-danger/10 disabled:opacity-30">
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />삭제
        </button>
      </Td>
    </tr>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return <th className={cn('px-3 py-2.5 font-semibold', align === 'right' ? 'text-right' : 'text-left')}>{children}</th>;
}
function Td({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return <td className={cn('px-3 py-2.5 text-body text-foreground', align === 'right' ? 'text-right' : '')}>{children}</td>;
}

// ── 데이터 조정 탭 ─────────────────────────────────────────
function DataAdjustTab({ canEdit }: { canEdit: boolean }) {
  const [subTab, setSubTab] = useState<AdjustSubTab>('monthly');
  const [values, setValues] = useState<Record<string, (string | null)[]>>(() =>
    Object.fromEntries(ADJUST_ROWS.map((r) => [r.key, Array<null>(12).fill(null)])),
  );
  const [saved, setSaved] = useState(false);

  const handleChange = (rowKey: string, mi: number, val: string) => {
    setValues((prev) => {
      const row = [...(prev[rowKey] ?? Array<null>(12).fill(null))];
      row[mi] = val === '' ? null : val;
      return { ...prev, [rowKey]: row };
    });
    setSaved(false);
  };

  const handleReset = () => {
    setValues(Object.fromEntries(ADJUST_ROWS.map((r) => [r.key, Array<null>(12).fill(null)])));
    setSaved(false);
  };

  return (
    <div className="space-y-4">
      {/* 서브탭 바 */}
      <div className="flex gap-1 rounded-xl bg-muted p-1 self-start">
        <AdjTabBtn active={subTab === 'monthly'} onClick={() => setSubTab('monthly')}>월별실적 입력</AdjTabBtn>
        <AdjTabBtn active={subTab === 'supplies'} onClick={() => setSubTab('supplies')}>비품현황 조정</AdjTabBtn>
        <AdjTabBtn active={subTab === 'buildings'} onClick={() => setSubTab('buildings')}>건물정보 조정</AdjTabBtn>
      </div>

      {subTab === 'monthly' && (
        <Card className="p-5">
          <SectionHeader
            title="2026년 월별 실적 입력"
            description="각 항목의 월별 금액(백만원)을 입력하세요. 저장 후 자산 현황 탭의 추이 그래프에 즉시 반영됩니다."
          />
          <div className="mt-4 overflow-x-auto custom-scrollbar">
            <table className="min-w-[900px] w-full border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-muted/40">
                  <th className="sticky left-0 z-10 bg-muted/40 px-3 py-2.5 text-left text-caption font-semibold text-muted-foreground shadow-[1px_0_0_0_hsl(var(--border))]">항목</th>
                  {Array.from({ length: 12 }, (_, i) => (
                    <th key={i} className="px-2 py-2.5 text-center text-caption font-semibold text-muted-foreground">{i + 1}월</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ADJUST_ROWS.map((row, ri) => (
                  <tr key={row.key} className={cn('border-t border-border', ri % 2 !== 0 && 'bg-muted/20')}>
                    <td className="sticky left-0 z-10 bg-card px-3 py-2 text-body font-medium text-foreground shadow-[1px_0_0_0_hsl(var(--border))]">{row.label}</td>
                    {Array.from({ length: 12 }, (_, mi) => (
                      <td key={mi} className="px-1 py-1.5 text-center">
                        {canEdit ? (
                          <input
                            type="number"
                            value={values[row.key]?.[mi] ?? ''}
                            onChange={(e) => handleChange(row.key, mi, e.target.value)}
                            placeholder="-"
                            className="w-full min-w-[56px] rounded-md border border-border bg-card px-1.5 py-1 text-center text-caption text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        ) : (
                          <span className="text-caption text-muted-foreground">{values[row.key]?.[mi] ?? '-'}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSaved(true)}
              disabled={!canEdit}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-body font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              저장 &amp; 반영
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={!canEdit}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-2 text-body font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              초기화
            </button>
            {saved && <span className="text-caption text-success">저장되었습니다.</span>}
          </div>
        </Card>
      )}

      {subTab === 'supplies' && (
        <Card className="p-5">
          <SectionHeader title="비품현황 조정" description="비품 재고 및 운영 데이터를 직접 수정합니다." />
          <EmptyState icon={Package} title="준비 중" description="비품현황 조정 기능은 다음 릴리즈에서 제공됩니다." />
        </Card>
      )}

      {subTab === 'buildings' && (
        <Card className="p-5">
          <SectionHeader title="건물정보 조정" description="건물 기본 정보를 수정합니다." />
          <EmptyState icon={Building} title="준비 중" description="건물정보 조정 기능은 다음 릴리즈에서 제공됩니다." />
        </Card>
      )}
    </div>
  );
}

function AdjTabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg px-3 py-1.5 text-caption font-medium transition-colors duration-150',
        active ? 'bg-card text-foreground shadow-elev-1' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}
