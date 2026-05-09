// 인증 가드 — boot 끝날 때까지 빈 화면, 미인증이면 /login 리다이렉트
import { useEffect, type PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

export function AuthGuard({ children }: PropsWithChildren) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const boot = useAuthStore((s) => s.boot);
  const location = useLocation();

  useEffect(() => {
    void boot();
  }, [boot]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">
        로딩 중…
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
