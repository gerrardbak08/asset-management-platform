// 저장소 어댑터 인터페이스 — 1단계 LocalDisk, 2단계 MinIO/S3 로 교체 가능
export type SaveResult = { key: string; url: string; bytes: number };

export interface StorageAdapter {
  save(key: string, data: Buffer, contentType?: string): Promise<SaveResult>;
  read(key: string): Promise<Buffer>;
  publicUrl(key: string): string;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}
