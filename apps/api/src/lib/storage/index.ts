// 저장소 어댑터 부트스트랩 — config.STORAGE_DRIVER 에 따라 인스턴스 결정
import path from 'node:path';
import { config } from '@/config';
import { LocalDiskAdapter } from './LocalDiskAdapter';
import type { StorageAdapter } from './StorageAdapter';

export function createStorage(): StorageAdapter {
  switch (config.STORAGE_DRIVER) {
    case 'local':
      return new LocalDiskAdapter(path.resolve(config.UPLOADS_DIR));
    case 's3':
      // TODO(2단계): S3Adapter 구현
      throw new Error('S3 어댑터는 2단계 작업');
    default:
      throw new Error(`지원하지 않는 STORAGE_DRIVER: ${config.STORAGE_DRIVER as string}`);
  }
}

export const storage = createStorage();
export type { StorageAdapter, SaveResult } from './StorageAdapter';
