// SectionHeader — 전체에서 유일한 SectionHeader (DESIGN.md §6). 다른 위치에서 만들지 않는다
import type { ReactNode } from 'react';

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function SectionHeader({ title, description, action }: Props) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-heading-sm font-semibold tracking-tight text-foreground">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-caption text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
