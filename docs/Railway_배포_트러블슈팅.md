# Railway 배포 트러블슈팅 기록

> 최초 작성: 2026-05-22
> 프로젝트: asset-management (aims-platform.up.railway.app)

---

## 사건 개요

2026-05-22, 배포된 앱에서 **"Application failed to respond"** 오류 발생.
마지막 정상 배포(2026-05-13, `a297a701`) 이후 약 9일간 유지되다 응답 불가 상태 진입.

---

## 원인 분석

### 1차 분석 — 잘못된 추정 (tsx devDependency 문제)

초기 가설: `startCommand`에서 `pnpm exec tsx src/server.ts`를 사용 중인데,
`tsx`가 devDependency이면 Railway 런타임에서 실행 불가.

→ **오판이었음.** `tsx`는 `apps/api/package.json`의 `dependencies`에 이미 포함되어 있었음.

### 2차 분석 — 실제 오류 확인

`serviceInstanceDeployV2` GraphQL mutation으로 재배포 트리거 후
Railway 배포 로그(`deploymentLogs`)를 직접 조회한 결과:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/app/apps/api/dist/src/config'
imported from /app/apps/api/dist/src/server.js
```

**원인:** `node dist/src/server.js`로 시작 명령을 변경했을 때 발생한 ESM 모듈 경로 문제.

- TypeScript → `tsc` 컴파일 결과물이 ESM 형식
- ESM에서는 상대 경로 import 시 `.js` 확장자가 명시되어야 함
- 컴파일된 `dist/src/server.js`의 import 구문에 확장자 없음 → Node.js가 모듈 탐색 실패
- `tsx`는 TypeScript 런타임이므로 이 문제가 없었음

### 3차 분석 — 원래 오류의 실제 원인

Railway CLI 토큰 만료로 인해 `railway logs`를 즉시 확인하지 못했으나,
로그 조회 시점(2026-05-22)에 마지막 정상 배포(a297a701)가 여전히 `Online` 상태였음.

"Application failed to respond"의 원인은 **Railway 컨테이너 일시 슬립 또는 인프라 일시 장애**였을 가능성이 높음.
코드 문제가 아니었음.

---

## 처리 내역

| 시각(UTC) | 커밋/액션 | 결과 |
|-----------|-----------|------|
| 2026-05-22T10:13 | `5c62888` — `tsx` → `node dist/server.js`, timeout 120s | FAILED (경로 오류) |
| 2026-05-22T10:18 | `509cb37` — `node dist/server.js` → `node dist/src/server.js` | FAILED (ESM 오류) |
| 2026-05-22T10:33 | GraphQL 수동 재배포 트리거 | FAILED (ESM 오류 동일) |
| 2026-05-22T10:47 | `460ba61` — `tsx src/server.ts` 복원 + timeout 120s 유지 | **SUCCESS** |

---

## 최종 `railway.toml` 상태

```toml
[build]
builder = "nixpacks"
buildCommand = "bash scripts/build.sh"

[deploy]
startCommand = "echo '--- RUNTIME DIR CHECK ---' && ls apps/api/public/files/buildings/ 2>/dev/null | wc -l && cd apps/api && pnpm exec prisma migrate deploy && (pnpm run db:seed || echo 'seed skipped') && pnpm exec tsx src/server.ts"
healthcheckPath = "/api/health"
healthcheckTimeout = 120
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

**변경 사항 (5월 13일 원본 대비):**
- `healthcheckTimeout`: 30 → **120** (마이그레이션 + 시드 실행 시간 확보)
- `startCommand`: 동일 (`tsx src/server.ts` 유지)

---

## 교훈

### Railway CLI 토큰 관리
- Railway OAuth 토큰은 약 1시간 만료. `railway whoami`로 갱신 가능.
- `invalid_grant` 오류 발생 시 `railway whoami`로는 갱신 불가 → `railway login` 재실행 필요.
- 토큰이 없더라도 `~/.railway/config.json`의 `accessToken`으로 GraphQL API 직접 호출 가능.

### Railway GraphQL API 활용
```bash
# 토큰 확인
cat ~/.railway/config.json | python3 -c "import json,sys; print(json.load(sys.stdin)['user']['accessToken'])"

# 수동 배포 트리거
curl -X POST https://backboard.railway.app/graphql/v2 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { serviceInstanceDeployV2(serviceId: \"<SERVICE_ID>\", environmentId: \"<ENV_ID>\") }"}'

# 특정 배포 로그 조회
curl -X POST https://backboard.railway.app/graphql/v2 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ deploymentLogs(deploymentId: \"<DEPLOY_ID>\") { message severity } }"}'

# 배포 목록 조회
curl -X POST https://backboard.railway.app/graphql/v2 \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ deployments(input: { serviceId: \"<SERVICE_ID>\" }) { edges { node { id status createdAt } } } }"}'
```

### TSX vs Node 실행 방식
- `tsx src/server.ts` — TypeScript 소스 직접 실행. ESM 경로 문제 없음. 빠른 시작.
- `node dist/src/server.js` — 컴파일된 JS 실행. ESM 프로젝트에서는 import 경로에 `.js` 확장자 필요.
- 이 프로젝트는 `tsx` 방식이 적합. `tsx`가 `dependencies`에 포함되어 있어 프로덕션 사용 가능.

### 프로젝트 식별자 (Railway)
```
Project ID:      31b09a2a-1120-4682-b6d3-51b0fc5a9cdc
Environment ID:  2ca682a9-1c95-4377-8dbd-e958e189014d
Service ID:      be42cfea-1636-43d9-83ea-f9d709744e70
URL:             https://aims-platform.up.railway.app
```
