// 좌측 사이드바 — 다이소 다크네이비 chrome. 활성 항목은 배경+텍스트 톤만 변화 (좌측 strip / 아이콘 앰버 컬러 모두 제거)
import { NavLink } from 'react-router-dom';
import { ArrowRightLeft, Building2, Building, Calculator, FileText, Shield, Store, Wrench } from 'lucide-react';
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
];

export function Sidebar() {
  const operations = MENU.filter((m) => m.group === '운영');
  const management = MENU.filter((m) => m.group === '관리');

  return (
    <aside className="hidden w-[240px] shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border bg-sidebar px-4">
        <AsungSymbol />
        <div className="min-w-0">
          <div className="text-[18px] font-bold leading-snug tracking-tight text-sidebar-foreground">
            전사 자산관리 시스템
          </div>
          <div className="mt-0.5 text-micro text-sidebar-muted-foreground">2026년 3월 · 전사 자산 현황</div>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
        <SidebarGroup label="운영" items={operations} />
        <SidebarGroup label="관리" items={management} />
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3 text-micro text-sidebar-muted-foreground">
        v0.2.0 · 2단계
      </div>
    </aside>
  );
}

function SidebarGroup({ label, items }: { label: string; items: MenuItem[] }) {
  return (
    <div>
      <div className="px-2 py-1.5 text-micro uppercase tracking-wider text-sidebar-muted-foreground">
        {label}
      </div>
      <ul className="space-y-0.5">
        {items.map((m) => (
          <li key={m.to} className="relative">
            <NavLink
              to={m.to}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-2 rounded-lg px-3 py-2 text-body font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-white/5 text-white'
                    : 'text-sidebar-foreground/85 hover:bg-white/5 hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <m.icon
                    className={cn(
                      'h-4 w-4 transition-colors duration-150',
                      isActive ? 'text-white' : 'text-sidebar-foreground/60',
                    )}
                    aria-hidden="true"
                  />
                  <span>{m.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
