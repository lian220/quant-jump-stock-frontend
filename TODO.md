# Frontend 기술 부채 TODO

> **스코프 (Scope)**: Frontend 단독 기술 부채 — 보안/아키텍처/성능/UX 리팩토링
> **문서 역할**: Frontend 서비스 내부 개선 항목 관리
>
> **여기 없는 것 (다른 곳에서 관리)**:
> - 제품 기능 우선순위 + 크로스 서비스 작업 → [../docs/할일.md](../docs/할일.md) (SSOT)
> - 백로그/이슈 트래킹 → Jira (`SCRUM-*`)
> - 사용자경험 액션 → [사용자경험_액션_항목.md](./docs/사용자경험_액션_항목.md)

---

## 보안 (코드 리뷰 2026-02-19)
- [ ] localStorage → httpOnly 쿠키 토큰 저장 마이그레이션
  - `AuthContext.tsx`, `auth/callback/page.tsx` — XSS 공격 시 토큰 탈취 위험
  - 서버 사이드에서 Set-Cookie(httpOnly, Secure, SameSite=Strict) 방식으로 전환
- [ ] CSRF 보호 미들웨어 구현
  - POST/PUT/DELETE API 라우트에 CSRF 토큰 검증 없음
  - Next.js 미들웨어에서 double-submit cookie 또는 Origin 헤더 검증

## 아키텍처
- [ ] 컴포넌트 설계 패턴 정립 (Container/Presentational)
- [ ] 에러 바운더리 구현
- [ ] 로딩 스켈레톤 공통화
- [ ] RSC/Client Component 경계 기준 문서화 (`docs/architecture/개요.md`)
- [ ] OpenAPI → TS 타입 자동 생성 파이프라인 도입 (`openapi-typescript` 또는 `orval`)

## 성능
- [ ] 번들 사이즈 최적화 (`@next/bundle-analyzer` 도입)
- [ ] 이미지 최적화 (Next.js Image)
- [ ] 코드 스플리팅 강화

## 테스트
- [ ] Playwright E2E 테스트 주요 플로우 커버리지
- [ ] 컴포넌트 유닛 테스트 도입 (Vitest + React Testing Library)

## UX
- [ ] 반응형 디자인 개선
- [ ] 접근성(a11y) 점검 (`axe-core` 도입)
