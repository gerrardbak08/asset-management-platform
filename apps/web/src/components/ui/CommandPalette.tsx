// 전역 검색 커맨드 팔레트 — Cmd+K / Ctrl+K 로 열림
import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightLeft,
  Building,
  Building2,
  Calculator,
  ClipboardList,
  FileText,
  Search,
  Shield,
  Store,
  Wrench,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

type Item = {
  id: string;
  label: string;
  description?: string;
  icon: typeof Building;
  path: string;
  group: string;
};

const NAV_ITEMS: Item[] = [
  { id: 'dashboard', label: '자산현황', description: 'MoM KPI · 자산 드릴다운', icon: Building2, path: '/dashboard', group: '페이지' },
  { id: 'buildings', label: '건물', description: '15동 건물 카드 · 지도', icon: Building, path: '/buildings', group: '페이지' },
  { id: 'stores', label: '사업장', description: '2,015개 사업장 검색', icon: Store, path: '/stores', group: '페이지' },
  { id: 'leases', label: '임대계약', description: '만료 임박 · 계약 현황', icon: FileText, path: '/leases', group: '페이지' },
  { id: 'maintenance', label: '유지보수', description: '칸반 · 유지보수 로그', icon: Wrench, path: '/maintenance', group: '페이지' },
  { id: 'ledger', label: '비품 원장', description: '구매·이동·폐기 거래', icon: ArrowRightLeft, path: '/ledger', group: '페이지' },
  { id: 'depreciation', label: '감가상각', description: '건물·비품 감가상각 스케줄', icon: Calculator, path: '/depreciation', group: '페이지' },
  { id: 'admin', label: '관리', description: '사용자 관리 · 데이터 업로드', icon: Shield, path: '/admin', group: '페이지' },
  { id: 'audit-logs', label: '감사 로그', description: '시스템 조작 이력', icon: ClipboardList, path: '/audit-logs', group: '페이지' },
];

type Props = { open: boolean; onClose: () => void };

export function CommandPalette({ open, onClose }: Props) {
  const navigate = useNavigate();
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!open) setValue('');
  }, [open]);

  function handleSelect(path: string) {
    navigate(path);
    onClose();
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-[20vh] z-50 w-full max-w-lg -translate-x-1/2 rounded-2xl border border-border bg-card shadow-elev-3 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          aria-label="전역 검색"
        >
          <Command className="flex flex-col overflow-hidden rounded-2xl" shouldFilter>
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <Command.Input
                value={value}
                onValueChange={setValue}
                placeholder="페이지, 기능 검색…"
                className="flex-1 bg-transparent text-body text-foreground outline-none placeholder:text-muted-foreground"
              />
              <kbd className="shrink-0 rounded border border-border px-1.5 py-0.5 text-micro text-muted-foreground">ESC</kbd>
            </div>

            <Command.List className="max-h-[400px] overflow-y-auto p-2">
              <Command.Empty className="py-8 text-center text-caption text-muted-foreground">
                일치하는 항목이 없습니다.
              </Command.Empty>

              <Command.Group heading="페이지" className="[&>[cmdk-group-heading]]:px-2 [&>[cmdk-group-heading]]:py-1.5 [&>[cmdk-group-heading]]:text-micro [&>[cmdk-group-heading]]:font-semibold [&>[cmdk-group-heading]]:uppercase [&>[cmdk-group-heading]]:tracking-wider [&>[cmdk-group-heading]]:text-muted-foreground">
                {NAV_ITEMS.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={`${item.label} ${item.description ?? ''}`}
                    onSelect={() => handleSelect(item.path)}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-body text-foreground outline-none aria-selected:bg-muted"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-primary">
                      <item.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium">{item.label}</div>
                      {item.description ? (
                        <div className="truncate text-caption text-muted-foreground">{item.description}</div>
                      ) : null}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>

            <div className="border-t border-border px-4 py-2 text-micro text-muted-foreground">
              <kbd className="rounded border border-border px-1 py-0.5">↑</kbd>
              <kbd className="ml-1 rounded border border-border px-1 py-0.5">↓</kbd>
              &nbsp;이동 &nbsp;
              <kbd className="rounded border border-border px-1 py-0.5">Enter</kbd>
              &nbsp;선택
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
