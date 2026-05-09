// 건물 도메인 헬퍼 — V16 regionOf / 용도 4그룹 매핑 그대로
export function regionOf(addr: string): string {
  const r = (addr || '').split(' ')[0] ?? '';
  if (r.includes('경기')) return '경기';
  if (r.includes('강원')) return '강원';
  if (r.includes('경남') || r.includes('경상남도')) return '경남';
  if (r.includes('경북') || r.includes('경상북도')) return '경북';
  if (r.includes('서울')) return '서울';
  if (r.includes('세종')) return '세종';
  if (r.includes('부산')) return '부산';
  if (r.includes('인천')) return '인천';
  if (r.includes('대구')) return '대구';
  if (r.includes('대전')) return '대전';
  if (r.includes('광주')) return '광주';
  if (r.includes('울산')) return '울산';
  if (r.includes('충남') || r.includes('충청남도')) return '충남';
  if (r.includes('충북') || r.includes('충청북도')) return '충북';
  if (r.includes('전남') || r.includes('전라남도')) return '전남';
  if (r.includes('전북') || r.includes('전라북도')) return '전북';
  if (r.includes('제주')) return '제주';
  return r || '기타';
}

// 수도권(서울·경기·인천) vs 지방 (V16 건물 상세 화면 동등)
export type RegionBucket = '수도권' | '지방';
export const ALL_REGION_BUCKETS: RegionBucket[] = ['수도권', '지방'];
export function regionBucketOf(addr: string): RegionBucket {
  const r = addr || '';
  if (r.includes('서울') || r.includes('경기') || r.includes('인천')) return '수도권';
  return '지방';
}

export type UseGroup = '창고시설' | '판매시설' | '공동주택·업무시설' | '제1종근린생활시설' | '기타';

export function useGroupOf(use: string): UseGroup {
  if (!use) return '기타';
  if (use.includes('창고')) return '창고시설';
  if (use.includes('판매')) return '판매시설';
  if (use.includes('공동주택') || use.includes('업무시설')) return '공동주택·업무시설';
  if (use.includes('제1종')) return '제1종근린생활시설';
  return '기타';
}

export const ALL_USE_GROUPS: UseGroup[] = [
  '창고시설',
  '판매시설',
  '공동주택·업무시설',
  '제1종근린생활시설',
  '기타',
];

export type SortKey = 'acq_desc' | 'acq_asc' | 'price_desc' | 'price_asc' | 'name_asc';

export const SORT_LABEL: Record<SortKey, string> = {
  acq_desc: '취득일 (최신)',
  acq_asc: '취득일 (오래된)',
  price_desc: '취득가 (높은)',
  price_asc: '취득가 (낮은)',
  name_asc: '이름 (가나다)',
};
