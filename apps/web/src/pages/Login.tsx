// 로그인 페이지 — DESIGN.md §12 인증 페이지 패턴 (`bg-primary` 배경)
import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

type LocationState = { from?: string };

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      const from = (location.state as LocationState)?.from ?? '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인 실패');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 shadow-elev-3"
      >
        <div className="flex items-center gap-2 text-foreground">
          <Building2 className="h-5 w-5 text-primary" aria-hidden="true" />
          <h1 className="text-display-md tracking-tight">자산관리</h1>
        </div>
        <p className="text-caption text-muted-foreground">
          1단계 — 자체 ID/PW 로그인. 첫 로그인 후 비밀번호를 즉시 변경하세요.
        </p>

        <div className="space-y-3">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-caption font-medium text-muted-foreground">
              이메일
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-body text-foreground placeholder:text-muted-foreground transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-caption font-medium text-muted-foreground">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-body text-foreground placeholder:text-muted-foreground transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-danger-border bg-danger-subtle px-3 py-2 text-caption text-danger">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-primary px-4 py-2 text-body font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? '로그인 중…' : '로그인'}
        </button>
      </form>
    </div>
  );
}
