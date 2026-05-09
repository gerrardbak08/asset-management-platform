// API fetch wrapper — 같은 origin (Vite proxy 경유) + credentials include 로 쿠키 자동 전송
export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; code: string; message: string };
export type ApiResponse<T> = ApiOk<T> | ApiErr;

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
  }
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const init: RequestInit = {
    method,
    credentials: 'include',
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  };
  const res = await fetch(`/api${path}`, init);
  let payload: ApiResponse<T>;
  try {
    payload = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError('INTERNAL', `${res.status} 응답 본문 파싱 실패`, res.status);
  }
  if (!payload.ok) {
    throw new ApiError(payload.code, payload.message, res.status);
  }
  return payload.data;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
