// 건물 API — list / detail / update / 사진 업로드 / 메모
import { api, ApiError } from './index';

export type Building = {
  id: string;
  legacyId: string;
  name: string;
  address: string;
  use: string;
  area: { sqm: number; pyeong: number };
  floors: string;
  approvalDate: string | null;
  acquisitionDate: string;
  acquisitionPrice: string; // BigInt 문자열
  rental: { area: number; rate: number; vacancy: number };
  tenant: string;
  lat: number;
  lng: number;
  photoUrl: string | null;
  detailPhotoUrl: string | null;
  updatedBy: string | null;
  updatedAt: string;
};

export type BuildingMemo = {
  buildingId: string;
  body: string;
  updatedBy: string | null;
  updatedAt: string;
};

export type BuildingPatch = {
  name?: string;
  address?: string;
  use?: string;
  tenant?: string;
  rental?: { area: number; rate: number; vacancy: number };
  area?: { sqm: number; pyeong: number };
  floors?: string;
};

export const buildingsApi = {
  list: () => api.get<Building[]>('/buildings'),
  detail: (id: string) => api.get<Building>(`/buildings/${id}`),
  update: (id: string, patch: BuildingPatch) => api.put<Building>(`/buildings/${id}`, patch),
  getMemo: (id: string) => api.get<BuildingMemo | null>(`/buildings/${id}/memo`),
  updateMemo: (id: string, body: string) =>
    api.put<BuildingMemo>(`/buildings/${id}/memo`, { body }),
  uploadPhoto: async (id: string, file: File): Promise<{ photoUrl: string; bytes: number }> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`/api/buildings/${id}/photo`, {
      method: 'POST',
      body: fd,
      credentials: 'include',
    });
    const json = (await res.json()) as
      | { ok: true; data: { photoUrl: string; bytes: number } }
      | { ok: false; code: string; message: string };
    if (!json.ok) throw new ApiError(json.code, json.message, res.status);
    return json.data;
  },
};
