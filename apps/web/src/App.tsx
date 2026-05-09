// 자산관리 플랫폼 메인 앱 — /login (공개) + AuthGuard 보호 메인 셸 + < md 모바일 하단 네비
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { AuthGuard } from '@/components/AuthGuard';
import Dashboard from '@/pages/Dashboard';
import Buildings from '@/pages/Buildings';
import Stores from '@/pages/Stores';
import Data from '@/pages/Data';
import Admin from '@/pages/Admin';
import Login from '@/pages/Login';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <AuthGuard>
            <div className="flex h-screen bg-background text-foreground">
              <Sidebar />
              <main className="flex min-w-0 flex-1 flex-col overflow-hidden pb-14 md:pb-0">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/buildings" element={<Buildings />} />
                  <Route path="/stores" element={<Stores />} />
                  <Route path="/data" element={<Data />} />
                  <Route path="/admin" element={<Admin />} />
                </Routes>
              </main>
              <MobileNav />
            </div>
          </AuthGuard>
        }
      />
    </Routes>
  );
}
