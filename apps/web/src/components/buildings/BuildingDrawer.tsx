// 건물 드로어 — Radix Dialog + Tabs. V16 의 5탭 (기본·임대·관리이력·메모·지도) 그대로
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Maximize2, Upload, X } from 'lucide-react';
import { buildingsApi, type Building } from '@/lib/api/buildings';
import { phase2Api } from '@/lib/api/phase2';
import { useAuthStore } from '@/store/auth';
import { fmtKRprice } from '@/lib/format';
import {
  depMethodLabel,
  leaseStatusLabel,
  maintenanceCategoryLabel,
  maintenancePriorityLabel,
  maintenanceStatusLabel,
} from '@/lib/phase2Labels';
import { PhotoFallback } from './PhotoFallback';
import { PhotoLightbox, type LightboxPhoto } from './PhotoLightbox';
import { BuildingMap } from './BuildingMap';

const TAB_LABELS: Record<TabValue, string> = {
  info: '기본정보',
  lease: '임대현황',
  history: '관리이력',
  depreciation: '감가상각',
  memo: '메모',
  map: '지도',
};
type TabValue = 'info' | 'lease' | 'history' | 'depreciation' | 'memo' | 'map';
const TABS: TabValue[] = ['info', 'lease', 'history', 'depreciation', 'memo', 'map'];

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
  const leasesQ = useQuery({
    queryKey: ['leases', building.id],
    queryFn: () => phase2Api.leases(`?buildingId=${encodeURIComponent(building.id)}`),
    enabled: open,
  });
  const maintenanceQ = useQuery({
    queryKey: ['maintenance', building.id],
    queryFn: () => phase2Api.maintenance(`?buildingId=${encodeURIComponent(building.id)}`),
    enabled: open,
  });
  const depreciationQ = useQuery({
    queryKey: ['depreciation', 'building', building.id],
    queryFn: () => phase2Api.buildingDepreciation(building.id),
    enabled: open,
    retry: false,
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

  // 라이트박스 — 대표/상세 사진 중 존재하는 것만 표시
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const photos = useMemo<LightboxPhoto[]>(() => {
    const list: LightboxPhoto[] = [];
    if (building.photoUrl) list.push({ url: building.photoUrl, label: '대표' });
    if (building.detailPhotoUrl) list.push({ url: building.detailPhotoUrl, label: '상세' });
    return list;
  }, [building.photoUrl, building.detailPhotoUrl]);
  const hasPhotos = photos.length > 0;

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

          <button
            type="button"
            onClick={() => {
              if (!hasPhotos) return;
              setLightboxIndex(0);
              setLightboxOpen(true);
            }}
            disabled={!hasPhotos}
            aria-label={hasPhotos ? `${building.name} 사진 확대 보기` : '사진 미등록'}
            className="group relative shrink-0 cursor-zoom-in disabled:cursor-default"
          >
            <PhotoFallback
              primary={building.photoUrl}
              fallback={building.detailPhotoUrl}
              alt={building.name}
              className="h-44 w-full"
            />
            {hasPhotos ? (
              <span className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-caption font-medium text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                <Maximize2 className="h-3 w-3" aria-hidden="true" />
                {photos.length === 2 ? '대표 + 상세' : '확대 보기'}
              </span>
            ) : null}
            {photos.length === 2 ? (
              <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-micro font-bold text-primary-foreground shadow-elev-1">
                상세 사진 있음
              </span>
            ) : null}
          </button>

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
                  v={`${fmtKRprice(Number(building.acquisitionPrice))}원`}
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
                <div className="pt-2">
                  <div className="mb-2 text-caption font-semibold text-muted-foreground">계약 타임라인</div>
                  {leasesQ.isLoading ? (
                    <p className="text-caption text-muted-foreground">로딩 중…</p>
                  ) : leasesQ.data?.length ? (
                    <div className="space-y-2">
                      {leasesQ.data.map((lease) => (
                        <div key={lease.id} className="rounded-xl border border-border bg-background p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-body font-semibold text-foreground">
                              {lease.tenantName}
                            </span>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-micro font-bold">
                              {leaseStatusLabel[lease.status]}
                            </span>
                          </div>
                          <div className="mt-2 text-caption text-muted-foreground">
                            {lease.contractStart} → {lease.contractEnd} · 월 {fmtKRprice(Number(lease.monthlyRent))}원
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-caption text-muted-foreground">등록된 계약 없음</p>
                  )}
                </div>
              </Tabs.Content>

              <Tabs.Content value="history" className="space-y-2">
                {maintenanceQ.isLoading ? (
                  <p className="text-caption text-muted-foreground">로딩 중…</p>
                ) : maintenanceQ.data?.length ? (
                  maintenanceQ.data.map((log) => (
                    <div key={log.id} className="rounded-xl border border-border bg-background p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-body font-semibold text-foreground">{log.title}</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-micro font-bold">
                          {maintenanceStatusLabel[log.status]}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-micro font-semibold text-muted-foreground">
                        <span className="rounded-md bg-muted px-2 py-1">
                          {maintenanceCategoryLabel[log.category]}
                        </span>
                        <span className="rounded-md bg-muted px-2 py-1">
                          {maintenancePriorityLabel[log.priority]}
                        </span>
                        {log.cost ? (
                          <span className="rounded-md bg-muted px-2 py-1">
                            {fmtKRprice(Number(log.cost))}원
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-caption text-muted-foreground">등록된 관리이력 없음</p>
                )}
              </Tabs.Content>

              <Tabs.Content value="depreciation" className="space-y-3">
                {depreciationQ.isLoading ? (
                  <p className="text-caption text-muted-foreground">로딩 중…</p>
                ) : depreciationQ.data ? (
                  <>
                    <Row k="취득가" v={`${fmtKRprice(Number(depreciationQ.data.acquisitionPrice))}원`} />
                    <Row k="내용연수" v={`${depreciationQ.data.usefulLifeYears}년`} />
                    <Row k="방법" v={depMethodLabel[depreciationQ.data.method]} />
                    <Row
                      k="최근 장부가"
                      v={
                        depreciationQ.data.entries && depreciationQ.data.entries.length > 0
                          ? `${fmtKRprice(Number(depreciationQ.data.entries[depreciationQ.data.entries.length - 1]!.bookValue))}원`
                          : '-'
                      }
                    />
                  </>
                ) : (
                  <p className="text-caption text-muted-foreground">감가상각 스케줄 없음</p>
                )}
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

      <PhotoLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        photos={photos}
        initialIndex={lightboxIndex}
        alt={building.name}
      />
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
