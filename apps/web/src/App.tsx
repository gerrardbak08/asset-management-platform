// 자산관리 플랫폼 메인 앱 — /login (공개) + AuthGuard 보호 메인 셸 + < md 모바일 하단 네비
import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { AuthGuard } from '@/components/AuthGuard';
import { CommandPalette } from '@/components/ui/CommandPalette';
import Login from '@/pages/Login';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Buildings = lazy(() => import('@/pages/Buildings'));
const Stores = lazy(() => import('@/pages/Stores'));
const Leases = lazy(() => import('@/pages/Leases'));
const Maintenance = lazy(() => import('@/pages/Maintenance'));
const Ledger = lazy(() => import('@/pages/Ledger'));
const Depreciation = lazy(() => import('@/pages/Depreciation'));
const Admin = lazy(() => import('@/pages/Admin'));
const AuditLogs = lazy(() => import('@/pages/AuditLogs'));

export default function App() {
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <AuthGuard>
            <div className="flex h-screen bg-background text-foreground">
              <Sidebar />
              <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <main className="flex min-w-0 flex-1 flex-col overflow-hidden pb-14 md:pb-0">
                  <Suspense fallback={<div className="p-5 text-caption text-muted-foreground">로딩 중…</div>}>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/buildings" element={<Buildings />} />
                      <Route path="/stores" element={<Stores />} />
                      <Route path="/leases" element={<Leases />} />
                      <Route path="/maintenance" element={<Maintenance />} />
                      <Route path="/ledger" element={<Ledger />} />
                      <Route path="/depreciation" element={<Depreciation />} />
                      <Route path="/data" element={<Admin />} />
                      <Route path="/admin" element={<Admin />} />
                      <Route path="/audit-logs" element={<AuditLogs />} />
                    </Routes>
                  </Suspense>
                </main>
                <MobileNav />
              </div>
            </div>
          </AuthGuard>
        }
      />
    </Routes>
    </>
  );
}
