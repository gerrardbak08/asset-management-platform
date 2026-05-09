// 사업장 API — 검색 + 페이지네이션 + 상세
import { api } from './index';

export type StoreListItem = {
  id: string;
  name: string;
  siteType: string | null;
  period: string;
  assetValue: number;
  assetCount: number;
  supplyValue: number;
};

export type StoreDetail = StoreListItem & {
  assetByType: Record<string, number>;
  supplyByCategory: Record<string, number>;
  supplyByCategoryCount: Record<string, number>;
};

export type StoreList = {
  items: StoreListItem[];
  total: number;
  page: number;
  limit: number;
};

export const storesApi = {
  list: (q: string, page = 1, limit = 40) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    params.set('page', String(page));
    params.set('limit', String(limit));
    return api.get<StoreList>(`/stores?${params.toString()}`);
  },
  detail: (id: string) => api.get<StoreDetail>(`/stores/${id}`),
};
