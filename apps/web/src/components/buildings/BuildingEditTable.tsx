// 건물 정보 인라인 편집 표 (admin/editor 전용) — V16 의 buildings 데이터조정 표 동등
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, X } from 'lucide-react';
import { buildingsApi, type Building } from '@/lib/api/buildings';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

type Patch = {
  name?: string;
  address?: string;
  use?: string;
  tenant?: string;
  rental?: { area: number; rate: number; vacancy: number };
};

type Props = { items: Building[] };

export function BuildingEditTable({ items }: Props) {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Patch>({});
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: (vars: { id: string; patch: Patch }) =>
      buildingsApi.update(vars.id, vars.patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['buildings'] });
      setEditingId(null);
      setDraft({});
      setError(null);
    },
    onError: (err) => setError(err.message),
  });

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full whitespace-nowrap text-caption">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <Th>코드</Th>
              <Th>건물명</Th>
              <Th>주소</Th>
              <Th>용도</Th>
              <Th align="right">임대율</Th>
              <Th align="right">공실률</Th>
              <Th>임차인</Th>
              <Th align="right">작업</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((b) => {
              const editing = editingId === b.id;
              return (
                <tr key={b.id} className="border-t border-border align-top">
                  <Td mono>{b.legacyId}</Td>
                  <Td>
                    {editing ? (
                      <Input
                        value={draft.name ?? b.name}
                        onChange={(v) => setDraft({ ...draft, name: v })}
                      />
                    ) : (
                      <span className="font-medium text-foreground">{b.name}</span>
                    )}
                  </Td>
                  <Td>
                    {editing ? (
                      <Input
                        value={draft.address ?? b.address}
                        onChange={(v) => setDraft({ ...draft, address: v })}
                      />
                    ) : (
                      <span className="text-muted-foreground">{b.address}</span>
                    )}
                  </Td>
                  <Td>
                    {editing ? (
                      <Input
                        value={draft.use ?? b.use}
                        onChange={(v) => setDraft({ ...draft, use: v })}
                      />
                    ) : (
                      <span className="text-muted-foreground">{b.use}</span>
                    )}
                  </Td>
                  <Td align="right" mono>
                    {editing ? (
                      <NumberInput
                        value={draft.rental?.rate ?? b.rental.rate}
                        onChange={(rate) =>
                          setDraft({
                            ...draft,
                            rental: {
                              area: draft.rental?.area ?? b.rental.area,
                              vacancy: Math.max(0, 100 - rate),
                              rate,
                            },
                          })
                        }
                        max={100}
                      />
                    ) : (
                      `${b.rental.rate}%`
                    )}
                  </Td>
                  <Td align="right" mono>
                    {editing
                      ? `${(draft.rental?.vacancy ?? b.rental.vacancy).toFixed(0)}%`
                      : `${b.rental.vacancy}%`}
                  </Td>
                  <Td>
                    {editing ? (
                      <Input
                        value={draft.tenant ?? b.tenant}
                        onChange={(v) => setDraft({ ...draft, tenant: v })}
                      />
                    ) : (
                      <span className="text-muted-foreground">{b.tenant}</span>
                    )}
                  </Td>
                  <Td align="right">
                    {editing ? (
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => mut.mutate({ id: b.id, patch: draft })}
                          disabled={mut.isPending}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-caption font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                          <Save className="h-3 w-3" aria-hidden="true" />
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setDraft({});
                            setError(null);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-caption text-muted-foreground hover:bg-muted"
                        >
                          <X className="h-3 w-3" aria-hidden="true" />
                          취소
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(b.id);
                          setDraft({});
                        }}
                        className="text-caption text-primary hover:underline"
                      >
                        편집
                      </button>
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {error ? (
        <div className="border-t border-danger-border bg-danger-subtle px-4 py-2 text-caption text-danger">
          저장 실패 — {error}
        </div>
      ) : null}
    </Card>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className={cn(
        'px-3 py-2 text-micro font-semibold uppercase tracking-wider',
        align === 'right' ? 'text-right' : 'text-left',
      )}
    >
      {children}
    </th>
  );
}
function Td({
  children,
  align = 'left',
  mono = false,
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  mono?: boolean;
}) {
  return (
    <td
      className={cn(
        'px-3 py-2',
        align === 'right' ? 'text-right' : 'text-left',
        mono ? 'font-mono tabular-nums' : '',
      )}
    >
      {children}
    </td>
  );
}

function Input({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-border bg-card px-2 py-1 text-caption text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
    />
  );
}
function NumberInput({
  value,
  onChange,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      min={0}
      max={max}
      step={1}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-20 rounded-lg border border-border bg-card px-2 py-1 text-right text-caption font-mono tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
    />
  );
}
