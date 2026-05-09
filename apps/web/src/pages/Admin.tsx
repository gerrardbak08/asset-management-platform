// 관리자 패널 — 시스템 통계 + 사용자 관리 (admin 전용) + 본인 비밀번호 변경
import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, KeyRound, UserPlus } from 'lucide-react';
import { adminApi, type AdminRole, type AdminUser } from '@/lib/api/admin';
import { useAuthStore } from '@/store/auth';
import { PageShell } from '@/components/ui/PageShell';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/features/dashboard/SectionHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChangePasswordDialog } from '@/components/admin/ChangePasswordDialog';
import { AdminDataCards } from '@/components/admin/AdminDataCards';
import { Shield } from 'lucide-react';

const ROLES: AdminRole[] = ['admin', 'editor', 'viewer', 'auditor'];

export default function Admin() {
  const me = useAuthStore((s) => s.user);
  const isAdmin = me?.role === 'admin';
  const qc = useQueryClient();
  const [pwOpen, setPwOpen] = useState(false);

  const stats = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminApi.stats,
    enabled: isAdmin,
  });
  const users = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminApi.users,
    enabled: isAdmin,
  });

  const createMut = useMutation({
    mutationFn: (vars: { email: string; password: string; role: AdminRole }) =>
      adminApi.createUser(vars.email, vars.password, vars.role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
  const updateMut = useMutation({
    mutationFn: (vars: { id: string; role?: AdminRole; password?: string }) =>
      adminApi.updateUser(vars.id, { role: vars.role, password: vars.password }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });

  return (
    <PageShell
      title="관리자"
      description="사용자·시스템 통계"
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
      {!isAdmin ? (
        <Card className="p-5">
          <EmptyState
            icon={Shield}
            title="admin 전용"
            description="관리자 패널은 admin 역할만 접근 가능합니다. 본인 비밀번호 변경은 우측 상단 버튼으로."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          <Card className="p-5">
            <SectionHeader title="시스템 통계" description="현재 DB 상태" />
            {stats.data ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="사용자" value={stats.data.users} />
                <Stat label="건물" value={stats.data.buildings} />
                <Stat label="비품 품목" value={stats.data.equipments} />
                <Stat label="비품 스냅샷" value={stats.data.equipmentSnapshots} />
                <Stat label="사업장" value={stats.data.stores} />
                <Stat label="월별 스냅샷" value={stats.data.monthlySnapshots} />
                <Stat label="기준월 수" value={stats.data.periods.length} />
                <Stat label="최신 기준월" value={stats.data.periods[0] ?? '-'} mono={false} />
              </div>
            ) : (
              <p className="text-caption text-muted-foreground">로딩 중…</p>
            )}
          </Card>

          <AdminDataCards />

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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/40 text-caption text-muted-foreground">
                  <tr>
                    <Th>이메일</Th>
                    <Th>역할</Th>
                    <Th>생성일</Th>
                    <Th align="right">작업</Th>
                  </tr>
                </thead>
                <tbody>
                  {(users.data ?? []).map((u) => (
                    <UserRow
                      key={u.id}
                      user={u}
                      isMe={u.id === me?.id}
                      onChangeRole={(role) => updateMut.mutate({ id: u.id, role })}
                      onDelete={() => deleteMut.mutate(u.id)}
                    />
                  ))}
                  {users.data && users.data.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-caption text-muted-foreground">
                        사용자 없음
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      <ChangePasswordDialog open={pwOpen} onClose={() => setPwOpen(false)} />
    </PageShell>
  );
}

function Stat({ label, value, mono = true }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <div className="text-caption text-muted-foreground">{label}</div>
      <div
        className={
          'mt-1 font-kpi-inline text-foreground ' + (mono ? 'font-mono tabular-nums' : 'font-sans')
        }
      >
        {typeof value === 'number' ? value.toLocaleString('ko-KR') : value}
      </div>
    </div>
  );
}

function CreateForm({
  onCreate,
  pending,
}: {
  onCreate: (v: { email: string; password: string; role: AdminRole }) => void;
  pending: boolean;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AdminRole>('viewer');

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onCreate({ email, password, role });
    setEmail('');
    setPassword('');
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr,1fr,140px,auto]">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@example.com"
        className="rounded-lg border border-border bg-card px-3 py-2 text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <input
        type="password"
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호 (8자 이상)"
        className="rounded-lg border border-border bg-card px-3 py-2 text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as AdminRole)}
        className="rounded-lg border border-border bg-card px-3 py-2 text-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-body font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90 disabled:opacity-50"
      >
        <UserPlus className="h-4 w-4" aria-hidden="true" />
        추가
      </button>
    </form>
  );
}

function UserRow({
  user,
  isMe,
  onChangeRole,
  onDelete,
}: {
  user: AdminUser;
  isMe: boolean;
  onChangeRole: (role: AdminRole) => void;
  onDelete: () => void;
}) {
  return (
    <tr className="border-t border-border">
      <Td>
        {user.email}
        {isMe ? <span className="ml-2 text-caption text-muted-foreground">(본인)</span> : null}
      </Td>
      <Td>
        <select
          value={user.role}
          disabled={isMe}
          onChange={(e) => onChangeRole(e.target.value as AdminRole)}
          className="rounded-lg border border-border bg-card px-2 py-1 text-caption text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </Td>
      <Td>{new Date(user.createdAt).toLocaleDateString('ko-KR')}</Td>
      <Td align="right">
        <button
          type="button"
          onClick={() => {
            if (!isMe && confirm(`${user.email} 을 삭제할까요?`)) onDelete();
          }}
          disabled={isMe}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-caption text-danger transition-colors duration-150 hover:bg-danger-subtle disabled:opacity-30"
          title={isMe ? '본인 계정은 삭제 불가' : '삭제'}
        >
          <Trash2 className="h-3 w-3" aria-hidden="true" />
          삭제
        </button>
      </Td>
    </tr>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className={`px-3 py-2 text-micro font-semibold uppercase tracking-wider ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      {children}
    </th>
  );
}
function Td({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <td className={`px-3 py-2 ${align === 'right' ? 'text-right' : 'text-left'}`}>{children}</td>
  );
}
