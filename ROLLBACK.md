# ROLLBACK GUIDE — 디자인 시스템 개편 롤백 절차

> 작성일: 2026-05-13
> 대상: 2026-05-13 이후 진행되는 디자인 시스템 개편 작업

---

## 안전망 3중 구조

### 1. 불변 태그 (Immutable Tag)
```
v-before-design-overhaul-20260513
```
- 커밋: `c4f6a6f` (docs: DESIGN.md 기준 전체 UI 감사 리포트 추가)
- 절대 이동하지 않는 고정 참조점

### 2. 백업 브랜치 (Long-lived Backup Branch)
```
backup/pre-design-overhaul-20260513
```
- 원격에 푸시 완료
- 개편 작업 완료 후에도 최소 3개월 유지

### 3. 작업 브랜치 (Working Branch)
```
feat/design-system-overhaul-20260513
```
- 개편 작업은 모두 이 브랜치에서 진행
- 검증 완료 전까지 `main`에 병합하지 않음

---

## 긴급 롤백 시나리오

### 시나리오 A: 아직 병합 전 (작업 브랜치 포기)
```bash
# 작업 브랜치 전체 폐기
git checkout main
git branch -D feat/design-system-overhaul-20260513
# 원격 브랜치도 삭제하려면
git push origin --delete feat/design-system-overhaul-20260513
```

### 시나리오 B: main 병합 후 문제 발생 (되돌리기)

**옵션 1 — 안전하게 revert 커밋 생성 (권장)**
```bash
git checkout main
# 병합 커밋부터 현재까지 전부 되돌리는 revert 커밋 생성
git revert --no-commit v-before-design-overhaul-20260513..HEAD
git commit -m "revert: 디자인 시스템 개편 롤백"
git push
```

**옵션 2 — main을 태그 시점으로 강제 이동 (신중히)**
```bash
# 원격 main을 태그 시점으로 강제 이동
git checkout main
git reset --hard v-before-design-overhaul-20260513
git push --force-with-lease origin main
```
⚠️ 다른 팀원의 작업이 유실될 수 있음. 반드시 팀 공지 후 실행.

### 시나리오 C: 배포 이후 긴급 롤백
```bash
# 배포 이미지가 있다면 그걸 먼저 롤백
# 코드는 옵션 1 (revert) 사용 권장
```

---

## 부분 롤백

특정 페이지만 원래대로 돌리고 싶을 때:
```bash
# 예: Stores.tsx만 원상복구
git checkout v-before-design-overhaul-20260513 -- apps/web/src/pages/Stores.tsx
git commit -m "revert: Stores.tsx 원래 버전으로 복구"
```

---

## 검증 체크리스트 (병합 전 확인)

- [ ] `pnpm --filter web build` 성공
- [ ] `pnpm --filter web lint` 통과
- [ ] 로컬 dev에서 8개 페이지 모두 정상 렌더 (Dashboard, Buildings, Stores, Leases, Maintenance, Ledger, Depreciation, Admin)
- [ ] 다크모드 / 라이트모드 모두 확인
- [ ] 모바일 뷰 (< md) 사이드바 숨김 + MobileNav 동작
- [ ] Chart 렌더링 깨짐 없음
- [ ] 로그인 플로우 정상

---

## 복원 확인

롤백 후 아래 명령으로 상태 확인:
```bash
git log --oneline -5                                # 최근 커밋 확인
git tag --list | grep design-overhaul               # 태그 존재 확인
git branch -a | grep backup                          # 백업 브랜치 확인
```

---

## 담당자 연락

문제 발생 시 즉시 커밋 해시를 공유하고 이 문서를 참조하세요.
