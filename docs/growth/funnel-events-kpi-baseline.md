# 퍼널 이벤트 계측 및 KPI 기준선

## 이벤트 최소 세트
- `landing_cta_click`
- `auth_view`
- `signup_start`
- `signup_complete`
- `first_analysis_view`

## 코드 기준 계측 포인트
- 랜딩 CTA 클릭: `src/app/page.tsx`
- 인증 화면 진입: `src/app/auth/page.tsx`
- 가입 시작(가입 화면 진입): `src/app/signup/page.tsx`
- 가입 완료: `src/components/auth/SignUpForm.tsx`
- 첫 가치 행동(분석 화면 첫 진입): `src/app/recommendations/page.tsx`

## KPI 기준선 정의
- 랜딩→인증 진입률 = `auth_view / landing_cta_click`
- 인증 진입→가입 완료율 = `signup_complete / auth_view`
- 가입 후 첫 가치행동 도달률 = `first_analysis_view / signup_complete`

## 대시보드
- 경로: `/funnel`
- 데이터 원본: 브라우저 로컬 저장소(`af_analytics_events`)
- 제공 기능:
  - 스텝별 이벤트 건수
  - 직전 스텝 대비 전환율
  - 임계치 기반 상태 배지(`정상/주의/위험`)
  - 표본 수 100건 미만 시 `표본 부족` 표시
  - 이벤트 새로고침/초기화

## 운영 참고
- 현재 기준선은 로컬 브라우저 이벤트 기반이므로 환경별로 값이 다를 수 있음
- 운영 전환 지표는 추후 서버 이벤트 파이프라인(GA/BigQuery 등)과 병행 권장
