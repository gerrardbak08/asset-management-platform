// 본인 비밀번호 변경 다이얼로그 (Radix Dialog)
import * as Dialog from '@radix-ui/react-dialog';
import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { meApi } from '@/lib/api/admin';

type Props = { open: boolean; onClose: () => void };

export function ChangePasswordDialog({ open, onClose }: Props) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const mut = useMutation({
    mutationFn: (vars: { current: string; next: string }) =>
      meApi.changePassword(vars.current, vars.next),
    onSuccess: () => {
      setDone(true);
      setCurrent('');
      setNext('');
      setConfirm('');
    },
  });

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (next !== confirm) {
      setError('새 비밀번호가 확인과 일치하지 않습니다');
      return;
    }
    if (next.length < 8) {
      setError('새 비밀번호는 8자 이상');
      return;
    }
    mut.mutate({ current, next });
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
          setError(null);
          setDone(false);
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-5 shadow-elev-3">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-heading-md font-semibold tracking-tight text-foreground">
              비밀번호 변경
            </Dialog.Title>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">닫기</span>
            </Dialog.Close>
          </div>

          {done ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-success-border bg-success-subtle px-3 py-2 text-caption text-success">
                비밀번호가 변경되었습니다.
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-primary px-4 py-2 text-body font-semibold text-primary-foreground hover:bg-primary/90"
              >
                닫기
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <Field
                label="현재 비밀번호"
                type="password"
                value={current}
                onChange={setCurrent}
                autoComplete="current-password"
              />
              <Field
                label="새 비밀번호"
                type="password"
                value={next}
                onChange={setNext}
                autoComplete="new-password"
              />
              <Field
                label="새 비밀번호 확인"
                type="password"
                value={confirm}
                onChange={setConfirm}
                autoComplete="new-password"
              />
              {error || mut.isError ? (
                <div className="rounded-xl border border-danger-border bg-danger-subtle px-3 py-2 text-caption text-danger">
                  {error ?? mut.error?.message}
                </div>
              ) : null}
              <button
                type="submit"
                disabled={mut.isPending}
                className="w-full rounded-xl bg-primary px-4 py-2 text-body font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90 disabled:opacity-50"
              >
                {mut.isPending ? '변경 중…' : '변경'}
              </button>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({
  label,
  type = 'text',
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-caption font-medium text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-body text-foreground placeholder:text-muted-foreground transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}
