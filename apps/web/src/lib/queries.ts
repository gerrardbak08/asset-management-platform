// 대시보드 데이터 페치 wrapper hooks — queryKey 표준화 + boilerplate 제거
import { useQuery } from '@tanstack/react-query';
import { buildingsApi } from '@/lib/api/buildings';
import { dashboardApi } from '@/lib/api/dashboard';

export function useBuildings(enabled = true) {
  return useQuery({ queryKey: ['buildings'], queryFn: buildingsApi.list, enabled });
}

export function useEquipmentSnapshots(period: string, enabled = true) {
  return useQuery({
    queryKey: ['equipments', 'snapshots', period],
    queryFn: () => dashboardApi.equipmentSnapshots(period),
    enabled,
  });
}

export function useMom(period: string, enabled = true) {
  return useQuery({
    queryKey: ['mom', period],
    queryFn: () => dashboardApi.mom(period),
    enabled,
  });
}

export function useAssetSnapshots() {
  return useQuery({ queryKey: ['snapshots'], queryFn: dashboardApi.snapshots });
}
