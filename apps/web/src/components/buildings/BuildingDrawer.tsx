// 건물 드로어 — Radix Dialog + Tabs. V16 의 5탭 (기본·임대·관리이력·메모·지도) 그대로
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, X } from 'lucide-react';
import { buildingsApi, type Building } from '@/lib/api/buildings';
import { useAuthStore } from '@/store/auth';
import { PhotoFallback } from './PhotoFallback';
import { BuildingMap } from './BuildingMap';

const TAB_LABELS: Record<TabValue, string> = {
  info: '기본정보',
  lease: '임대현황',
  history: '관리이력',
  memo: '메모',
  map: '지도',
};
type TabValue = 'info' | 'lease' | 'history' | 'memo' | 'map';
const TABS: TabValue[] = ['info', 'lease', 'history', 'memo', 'map'];

type Props = { building: Building; open: boolean; onClose: () => void };

export function BuildingDrawer({ building, open, onClose }: Props) {
  const role = useAuthStore((s) => s.user?.role);
  const canEdit = role === 'admin' || role === 'editor';
  const qc = useQueryClient();

  const memoQ = useQuery({
    queryKey: ['memo', building.id],
    queryFn: () => buildingsApi.getMemo(building.id),
    enabled: open,
  });

  const [memoBody, setMemoBody] = useState('');
  useEffect(() => {
    if (memoQ.data) setMemoBody(memoQ.data.body);
    else setMemoBody('');
  }, [memoQ.data]);

  const memoMut = useMutation({
    mutationFn: (body: string) => buildingsApi.updateMemo(building.id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['memo', building.id] }),
  });

  const fileRef = useRef<HTMLInputElement | null>(null);
  const photoMut = useMutation({
    mutationFn: (file: File) => buildingsApi.uploadPhoto(building.id, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['buildings'] }),
  });

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[600px] flex-col overflow-hidden border-l border-border bg-card text-foreground shadow-elev-3">
          <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-4">
            <Dialog.Title className="truncate text-heading-md font-semibold tracking-tight">
              {building.name}
            </Dialog.Title>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">닫기</span>
            </Dialog.Close>
          </header>

          <PhotoFallback
            primary={building.photoUrl}
            fallback={building.detailPhotoUrl}
            alt={building.name}
            className="h-44 w-full shrink-0"
          />

          <Tabs.Root defaultValue="info" className="flex min-h-0 flex-1 flex-col">
            <Tabs.List className="flex shrink-0 gap-1 border-b border-border px-2 pt-1">
              {TABS.map((v) => (
                <Tabs.Trigger
                  key={v}
                  value={v}
                  className="rounded-t-lg px-3 py-2 text-caption font-medium text-muted-foreground transition-colors duration-150 data-[state=active]:bg-muted data-[state=active]:text-foreground"
                >
                  {TAB_LABELS[v]}
                </Tabs.Trigger>
              ))}
            </Tabs.List>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <Tabs.Content value="info" className="space-y-3">
                <Row k="주소" v={building.address} />
                <Row k="용도" v={building.use} />
                <Row
                  k="연면적"
                  v={`${building.area.sqm.toLocaleString('ko-KR')} ㎡ (${building.area.pyeong.toLocaleString('ko-KR')} 평)`}
                />
                <Row k="층수" v={building.floors} />
                <Row k="사용승인일" v={building.approvalDate ?? '-'} />
                <Row k="취득일" v={building.acquisitionDate} />
                <Row
                  k="취득가"
                  v={`${Number(building.acquisitionPrice).toLocaleString('ko-KR')}원`}
                />
                {canEdit ? (
                  <div className="pt-3">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) photoMut.mutate(f);
                        e.currentTarget.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={photoMut.isPending}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-body font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90 disabled:opacity-50"
                    >
                      <Upload className="h-4 w-4" aria-hidden="true" />
                      {photoMut.isPending ? '업로드 중…' : '사진 등록'}
                    </button>
                    {photoMut.isError ? (
                      <p className="mt-2 text-caption text-danger">
                        업로드 실패 — {photoMut.error.message}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </Tabs.Content>

              <Tabs.Content value="lease" className="space-y-3">
                <Row k="임대면적" v={`${building.rental.area} ㎡`} />
                <Row k="임대율" v={`${building.rental.rate}%`} />
                <Row k="공실률" v={`${building.rental.vacancy}%`} />
                <Row k="임차인" v={building.tenant} />
              </Tabs.Content>

              <Tabs.Content value="history">
                <p className="text-caption text-muted-foreground">
                  관리이력은 2단계 (`maintenance_logs` 테이블) 에서 추가됩니다.
                </p>
              </Tabs.Content>

              <Tabs.Content value="memo">
                <textarea
                  value={memoBody}
                  onChange={(e) => setMemoBody(e.target.value)}
                  disabled={!canEdit}
                  rows={8}
                  placeholder={canEdit ? '메모를 입력하세요…' : '읽기 전용 (editor 이상 편집 가능)'}
                  className="w-full rounded-xl border border-border bg-muted px-3 py-2 text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                />
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => memoMut.mutate(memoBody)}
                    disabled={memoMut.isPending}
                    className="mt-2 rounded-xl bg-primary px-4 py-2 text-body font-semibold text-primary-foreground transition-colors duration-150 hover:bg-primary/90 disabled:opacity-50"
                  >
                    {memoMut.isPending ? '저장 중…' : '저장'}
                  </button>
                ) : null}
              </Tabs.Content>

              <Tabs.Content value="map">
                <BuildingMap
                  name={building.name}
                  address={building.address}
                  lat={building.lat}
                  lng={building.lng}
                />
              </Tabs.Content>
            </div>
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[100px,1fr] items-center gap-3">
      <span className="text-caption text-muted-foreground">{k}</span>
      <span className="break-words text-body text-foreground">{v}</span>
    </div>
  );
}
