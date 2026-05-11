# Railway 배포 가이드

Vercel 이외 배포 옵션은 Railway를 1순위로 채택한다.

## 결정

- **선택**: Railway
- **이유**: 현재 레포에 이미 `railway.toml`이 있고, Fastify API와 Vite SPA를 하나의 Node 서비스로 빌드해 서빙하는 구조와 맞다. PostgreSQL 서비스도 같은 프로젝트 안에서 붙일 수 있어 2단계 테이블 운영까지 이어가기 쉽다.
- **대안**:
  - Render: 정적 사이트 + Web Service를 분리하기 좋지만, 이 레포는 API가 SPA를 같이 서빙하도록 이미 구성되어 있어 Railway가 더 단순하다.
  - Fly.io: Docker·지역 배포 제어가 강하지만 첫 운영 단계에서는 볼륨, DB, 네트워크 설정 부담이 더 크다.
  - 사내 VPS + Docker Compose: 최종 운영 후보로 유지한다. 백업·장애 대응 담당자가 정해진 뒤 전환한다.

## Railway 서비스 구성

하나의 Railway 서비스에서 다음을 수행한다.

1. 루트에서 `pnpm install --frozen-lockfile`
2. `apps/api`에서 `prisma generate`와 API 빌드
3. `apps/web`에서 Vite 빌드
4. `apps/web/dist`를 `apps/api/public`으로 복사
5. `apps/api/start.sh`가 `prisma migrate deploy` 후 `node dist/src/server.js` 실행

Fastify는 Railway 공개 네트워크 요구에 맞춰 `HOST=::`를 기본값으로 사용한다.

## 필수 환경변수

```bash
NODE_ENV=production
PORT=3001
HOST=::
DATABASE_URL=<Railway Postgres DATABASE_URL>
SESSION_SECRET=<32바이트 이상 랜덤 문자열>
AUTH_PEPPER=<16바이트 이상 랜덤 문자열>
STORAGE_DRIVER=local
UPLOADS_DIR=./uploads
KAKAO_JS_KEY=<카카오 JavaScript 키>
KAKAO_REST_KEY=<카카오 REST 키>
CORS_ORIGIN=https://<railway-domain>
SEED_ADMIN_EMAIL=<운영 관리자 이메일>
SEED_ADMIN_PASSWORD=<초기 1회용 비밀번호>
```

## 배포 절차

1. Railway에서 새 프로젝트 생성
2. GitHub 저장소 `gerrardbak08/asset-management-platform` 연결
3. PostgreSQL 서비스 추가 후 `DATABASE_URL` 연결
4. 위 환경변수 입력
5. 배포 후 `/api/health` 헬스체크 확인
6. `pnpm --filter api db:seed`는 최초 관리자 계정이 필요할 때만 Railway Shell에서 1회 실행

## 운영 메모

- 업로드 파일을 오래 보존해야 하면 3단계 전에 S3/MinIO 저장소로 전환한다.
- `SEED_ADMIN_PASSWORD`는 최초 로그인 후 즉시 변경하고 Railway 변수에서 제거한다.
- 프로덕션 DB는 PostgreSQL 기준이며, SQLite 예시는 더 이상 운영 기준이 아니다.
