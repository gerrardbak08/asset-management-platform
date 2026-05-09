// EmptyState — DESIGN.md §6 의 아이콘 + 감정적 메시지 패턴 (V16 bld-img-ph 의 자산관리용 변형)
import type { LucideIcon } from 'lucide-react';

type Props = {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ icon: Icon, emoji, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {emoji ? <div className="mb-3 text-4xl">{emoji}</div> : null}
      {Icon ? <Icon className="mb-3 h-10 w-10 text-muted-foreground" aria-hidden="true" /> : null}
      <div className="mb-1 text-heading-sm font-semibold text-foreground">{title}</div>
      {description ? <div className="text-caption text-muted-foreground">{description}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
