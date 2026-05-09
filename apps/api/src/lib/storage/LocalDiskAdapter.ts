// 로컬 디스크 저장소 어댑터 — uploads/{key} 에 파일 저장. /files/* 정적 라우트로 노출
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { StorageAdapter, SaveResult } from './StorageAdapter';

export class LocalDiskAdapter implements StorageAdapter {
  constructor(private readonly baseDir: string) {}

  private resolve(key: string): string {
    // ../ 같은 path traversal 차단
    if (key.includes('..') || path.isAbsolute(key)) {
      throw new Error(`잘못된 key: ${key}`);
    }
    return path.join(this.baseDir, key);
  }

  async save(key: string, data: Buffer): Promise<SaveResult> {
    const target = this.resolve(key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, data);
    return { key, url: this.publicUrl(key), bytes: data.byteLength };
  }

  async read(key: string): Promise<Buffer> {
    return fs.readFile(this.resolve(key));
  }

  publicUrl(key: string): string {
    return `/files/${key.replace(/\\/g, '/')}`;
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.resolve(key));
    } catch (err: unknown) {
      const e = err as NodeJS.ErrnoException;
      if (e.code !== 'ENOENT') throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolve(key));
      return true;
    } catch {
      return false;
    }
  }
}
