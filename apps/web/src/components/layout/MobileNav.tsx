// 모바일 하단 네비 — < md 에서 활성, 5메뉴 (자산현황·건물·사업장·업로드·관리). 터치 ≥44px
import { NavLink } from 'react-router-dom';
import { Building2, Building, Store, Database, Shield } from 'lucide-react';
import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';

type MenuItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const ITEMS: MenuItem[] = [
  { to: '/dashboard', label: '자산현황', icon: Building2 },
  { to: '/buildings', label: '건물', icon: Building },
  { to: '/stores', label: '사업장', icon: Store },
  { to: '/data', label: '업로드', icon: Database },
  { to: '/admin', label: '관리', icon: Shield },
];

export function MobileNav() {
  return (
    <nav
      className="no-print fixed inset-x-0 bottom-0 z-30 flex h-14 items-stretch border-t border-border bg-card md:hidden"
      aria-label="주 메뉴"
    >
      {ITEMS.map((m) => (
        <NavLink
          key={m.to}
          to={m.to}
          className={({ isActive }) =>
            cn(
              'flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 text-micro font-medium transition-colors duration-150',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )
          }
        >
          <m.icon className="h-4 w-4" aria-hidden="true" />
          <span>{m.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
