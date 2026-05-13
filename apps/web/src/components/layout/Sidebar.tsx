// 좌측 사이드바 — 다이소 다크네이비 chrome. 활성 항목: 좌측 흰색 border-l + bg-white/10
import { NavLink } from 'react-router-dom';
import { ArrowRightLeft, Building2, Building, Calculator, ClipboardList, FileText, Shield, Store, Wrench } from 'lucide-react';
import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';
import { AsungSymbol } from './AsungLogo';

type MenuItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  group: '운영' | '관리';
};

const MENU: MenuItem[] = [
  { to: '/dashboard', label: '자산현황', icon: Building2, group: '운영' },
  { to: '/buildings', label: '건물', icon: Building, group: '운영' },
  { to: '/stores', label: '사업장', icon: Store, group: '운영' },
  { to: '/leases', label: '임대계약', icon: FileText, group: '운영' },
  { to: '/maintenance', label: '유지보수', icon: Wrench, group: '운영' },
  { to: '/ledger', label: '비품 원장', icon: ArrowRightLeft, group: '운영' },
  { to: '/depreciation', label: '감가상각', icon: Calculator, group: '운영' },
  { to: '/admin', label: '관리', icon: Shield, group: '관리' },
  { to: '/audit-logs', label: '감사 로그', icon: ClipboardList, group: '관리' },
];

export function Sidebar() {
  const operations = MENU.filter((m) => m.group === '운영');
  const management = MENU.filter((m) => m.group === '관리');

  return (
    <aside className="hidden w-[220px] shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
      {/* CI 헤더 */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4">
        <AsungSymbol />
        <div className="min-w-0">
          <p className="truncate text-body font-bold tracking-tight text-white">
            전사 자산관리
          </p>
          <p className="text-micro text-sidebar-muted-foreground">Asset Management</p>
        </div>
      </div>

      {/* 네비게이션 */}
      <nav className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-2 py-4">
        <SidebarGroup label="운영" items={operations} />
        <SidebarGroup label="관리" items={management} />
      </nav>

      {/* 하단 버전 */}
      <div className="shrink-0 border-t border-sidebar-border px-4 py-3 text-micro text-sidebar-muted-foreground">
        v0.2.3 · 2026-05-13
      </div>
    </aside>
  );
}

function SidebarGroup({ label, items }: { label: string; items: MenuItem[] }) {
  return (
    <div>
      <p className="mb-1 px-3 text-micro font-semibold uppercase tracking-widest text-sidebar-muted-foreground">
        {label}
      </p>
      <ul className="space-y-0.5">
        {items.map((m) => (
          <li key={m.to}>
            <NavLink
              to={m.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-caption font-medium transition-all duration-150',
                  isActive
                    ? 'border-l-2 border-white bg-white/10 text-white'
                    : 'border-l-2 border-transparent text-sidebar-foreground/70 hover:bg-white/5 hover:text-sidebar-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <m.icon
                    className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-white' : 'text-sidebar-foreground/50')}
                    aria-hidden="true"
                  />
                  <span className="truncate">{m.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
