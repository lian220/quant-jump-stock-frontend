# Frontend 기술 개선사항

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

## 성능
- [ ] 번들 사이즈 최적화
- [ ] 이미지 최적화 (Next.js Image)
- [ ] 코드 스플리팅 강화

## 테스트
- [ ] Playwright E2E 테스트 주요 플로우 커버리지
- [ ] 컴포넌트 유닛 테스트 도입

## UX
- [ ] 반응형 디자인 개선
- [ ] 접근성(a11y) 점검
